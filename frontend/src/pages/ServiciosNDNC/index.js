import React, { useState, useContext } from "react"
import { ThemeProvider, createTheme, styled } from "@mui/material/styles"
import { Box } from "@mui/material"
import { useNavigate } from "react-router-dom"
import Header from "../../layouts/Header"
import BackIcon from "../../components/BackIcon"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import ModalImportCSV from "../../components/CustomCSVImportButton"
import { GlobalContext } from "../../contexts/GlobalContext"

// Importaciones de la lógica maestra de barras y consultas
import { useQueryClient } from "@tanstack/react-query"
import { useMutation, api } from "../../api"
import getIconComponent from "../utils/getIconComponent"
import CustomBackdrop from "../../components/CustomBackdrop"
import {
  handleExportDataPdfLGScreen,
  handleExportDataPdfSMScreen,
  handleAllExportDataCSV,
} from "../utils/reactTableActions/exportToolbarActions"

const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(8),
  flexGrow: 1,
  padding: "0 16px",
  height: "100vh",
}))

// Tema estándar de SIACDEV1.0
const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const ServiciosNDNC = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openImportModal, setOpenImportModal] = useState(false)

  // Mutación para eliminación
  const { mutateAsync: SaveEliminacionServicio, isPending: isDeletingServicio } = useMutation({
    queryKey: ["isDeletingServicio"],
    fn: async (data) => {
      const response = await api.post("/ServiciosNDNC/eliminarServiciosNDNC", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      // Refresca la tabla después de eliminar exitosamente
      await qc.invalidateQueries({ queryKey: ["ServiciosNDNC"] })
    },
  })

  // Definición de las columnas de la tabla principal
  const columnsTable = [
    { accessorKey: "sercodigo", header: "Código", size: 80 },
    { accessorKey: "serdescri", header: "Descripción", size: 300 },
    {
      accessorKey: "serncnd",
      header: "Tipo",
      size: 150,
      Cell: ({ cell }) =>
        cell.getValue() === "D" ? "NOTA DE DÉBITO" : cell.getValue() === "C" ? "NOTA DE CRÉDITO" : cell.getValue(),
    },
    {
      accessorKey: "seriva",
      header: "Aplica I.V.A.",
      size: 100,
      Cell: ({ cell }) => (cell.getValue() === "1.00" || cell.getValue() === "1" ? "SÍ" : "NO"),
    },
    {
      accessorKey: "serautor",
      header: "Autorizado",
      size: 100,
      Cell: ({ cell }) => (cell.getValue() === 1 ? "SÍ" : "NO"),
    },
    {
      accessorKey: "serstatus",
      header: "Estado",
      size: 100,
      Cell: ({ cell }) => (cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"),
    },
  ]

  // Configuración estricta para el modal de importación CSV
  const fieldConfigs = {
    sercodigo: { required: true, key: true },
    serdescri: { required: true },
    serncnd: { required: true },
    seriva: { required: false },
    serautor: { required: false },
    serstatus: { required: false },
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 30px 30px 30px",
            fontSize: "25px",
          }}
        >
          <b>Gestión de Servicios para ND/NC</b>
        </div>

        <CustomBackdrop isLoading={isDeletingServicio} />

        <StyledRoot>
          {/* Modal de Importación CSV integrado */}
          <ModalImportCSV
            open={openImportModal}
            onClose={() => setOpenImportModal(false)}
            templateFileName="Plantilla_ServiciosNDNC.csv"
            fieldConfigs={fieldConfigs}
            validateEndpoint="/ServiciosNDNC/validarServiciosNDNCIMP"
            insertEndpoint="/ServiciosNDNC/insertarServiciosNDNCIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["ServiciosNDNC"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/ServiciosNDNC/getAllServiciosNDNC"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="ServiciosNDNC"
            perPage={10}
            rowActionsWidthTable={120}
            columnsTable={columnsTable}
            // LÓGICA MAESTRA: Botones de Fila (Editar y Eliminar)
            rowActions={(row) => {
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "EDITAR",
              )
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "ELIMINAR",
              )

              const actions = [
                {
                  label: editarAction?.acccaption || "Editar",
                  key: editarAction?.acccaption || "EDITAR",
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: (row) => {
                    navigate("editar", { state: row.original })
                  },
                },
                {
                  label: eliminarAction?.acccaption || "Eliminar",
                  key: eliminarAction?.acccaption || "ELIMINAR",
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    try {
                      await SaveEliminacionServicio(row.original)
                    } catch (err) {
                      console.error("Error eliminando el servicio:", err)
                    }
                  },
                },
              ]
              return actions
            }}
            // LÓGICA MAESTRA: Barra Superior (Crear, Exportar e Importar)
            topToolbarCustomActions={({ table, device }) => {
              const crearAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action.acccaption === "CREAR")
              const exportarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === "EXPORTAR",
              )
              const importarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === "IMPORTAR",
              )

              const toolbarActions = []
              if (crearAction) {
                toolbarActions.push({
                  label: crearAction?.acccaption,
                  key: crearAction?.acccaption,
                  icon: getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico),
                  onClick: () => navigate("crear"),
                })
              }
              if (exportarAction) {
                toolbarActions.push({
                  type: "dropdown",
                  label: exportarAction?.acccaption,
                  key: "exportarDropdown",
                  icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                  actions: [
                    {
                      label: "Exportar PDF",
                      key: "exportarPDF",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ columns, data }) => {
                        const title = "Reporte de Servicios para Nc y Nd"
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(
                            columns,
                            data,
                            title,
                            `${title} ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          title,
                          `${title} ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) =>
                        handleAllExportDataCSV(data, `Servicios NcNd ${new Date().toLocaleString()}`),
                    },
                  ],
                })
              }
              if (importarAction) {
                toolbarActions.push({
                  label: importarAction?.acccaption || "Importar",
                  key: "importarBtn",
                  icon: getIconComponent(
                    importarAction?.accnameicono || "UploadFile",
                    importarAction?.acctipoico || "MaterialIcons",
                  ),
                  onClick: () => setOpenImportModal(true),
                })
              }
              return toolbarActions
            }}
          />
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default ServiciosNDNC

import React, { useState, useContext } from "react"
import { ThemeProvider, createTheme, styled } from "@mui/material/styles"
import { Box } from "@mui/material"
import { useNavigate } from "react-router-dom"
import Header from "../../layouts/Header"
import BackIcon from "../../components/BackIcon"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import ModalImportCSV from "../../components/CustomCSVImportButton"
import { GlobalContext } from "../../contexts/GlobalContext"

// Nuevas importaciones de la lógica maestra de barras
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

const TipodeContraCli = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openImportModal, setOpenImportModal] = useState(false)

  // Mutación para eliminación con la misma lógica de TiposPredio
  const { mutateAsync: SaveEliminacionContrato, isPending: isDeletingContrato } = useMutation({
    queryKey: ["isDeletingContrato"],
    fn: async (data) => {
      const response = await api.post("/tipocontracli/eliminarTipodeContraCli", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      // Refresca la tabla después de eliminar
      await qc.invalidateQueries({ queryKey: ["TipodeContraCli"] })
    },
  })

  // Definición de las columnas de la tabla principal
  const columnsTable = [
    { accessorKey: "concodigo", header: "Código", size: 100 },
    { accessorKey: "condescri", header: "Descripción", size: 300 },
    { accessorKey: "confrecuencia", header: "Frecuencia", size: 150 },
    {
      accessorKey: "constatus",
      header: "Estado",
      size: 100,
      Cell: ({ cell }) => (cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"),
    },
  ]

  // Configuración estricta para el modal de importación CSV
  const fieldConfigs = {
    concodigo: { required: true, key: true },
    condescri: { required: true },
    confrecuencia: { required: true },
    constatus: { required: false },
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
          <b>Gestión de Tipo de Contratos Clientes</b>
        </div>

        <CustomBackdrop isLoading={isDeletingContrato} />

        <StyledRoot>
          {/* Modal de Importación CSV integrado */}
          <ModalImportCSV
            open={openImportModal}
            onClose={() => setOpenImportModal(false)}
            templateFileName="Plantilla_TiposContratos.csv"
            fieldConfigs={fieldConfigs}
            validateEndpoint="/tipocontracli/validarTipodeContraCliIMP"
            insertEndpoint="/tipocontracli/insertarTipodeContraCliIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["TipodeContraCli"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/tipocontracli/getAllTipodeContraCli"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="TipodeContraCli"
            perPage={10}
            rowActionsWidthTable={120}
            columnsTable={columnsTable}
            // LOGICA MAESTRA: Botones de Fila (Editar y Eliminar)
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
                      await SaveEliminacionContrato(row.original)
                    } catch (err) {
                      console.error("Error eliminando el tipo de contrato:", err)
                    }
                  },
                },
              ]
              return actions
            }}
            // LOGICA MAESTRA: Barra Superior (Crear, Exportar e Importar)
            topToolbarCustomActions={({ table, device }) => {
              const crearAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action.acccaption === "CREAR")
              const exportarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === "EXPORTAR",
              )

              const toolbarActions = [
                {
                  label: crearAction?.acccaption || "Crear",
                  key: crearAction?.acccaption || "CREAR",
                  icon: getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico),
                  onClick: () => {
                    navigate("crear")
                  },
                },
                {
                  type: "dropdown",
                  label: exportarAction?.acccaption || "Exportar",
                  key: "exportarDropdown",
                  icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                  actions: [
                    {
                      label: "Exportar PDF",
                      key: "exportarPDF",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ columns, data }) => {
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(
                            columns,
                            data,
                            "Reporte de Tipos de Contrato",
                            `Reporte de Tipos de Contrato ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Tipos de Contrato",
                          `Reporte de Tipos de Contrato ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte de Tipos de Contrato ${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                },
                {
                  label: "Importar",
                  key: "importarDropdown",
                  icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                  onClick: () => {
                    setOpenImportModal(true)
                  },
                },
              ]
              return toolbarActions
            }}
          />
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default TipodeContraCli

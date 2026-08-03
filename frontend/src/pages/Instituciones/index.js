import React, { useState, useContext } from "react"
import { ThemeProvider, createTheme, styled } from "@mui/material/styles"
import { Box } from "@mui/material"
import { useNavigate } from "react-router-dom"
import Header from "../../layouts/Header"
import BackIcon from "../../components/BackIcon"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import ModalImportCSV from "../../components/CustomCSVImportButton"
import { GlobalContext } from "../../contexts/GlobalContext"

// Lógica de acciones y API
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

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const Instituciones = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openImportModal, setOpenImportModal] = useState(false)

  // Mutación para eliminación
  const { mutateAsync: SaveEliminacion, isPending: isDeleting } = useMutation({
    queryKey: ["isDeletingInstitucion"],
    fn: async (data) => {
      const response = await api.post("/Instituciones/eliminarInstituciones", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["Instituciones"] })
    },
  })

  // Columnas de la tabla mapeadas a gdocbinstituciones
  const columnsTable = [
    { accessorKey: "insticodigo", header: "Código", size: 100 },
    { accessorKey: "instidescri", header: "Descripción", size: 300 },
    { accessorKey: "instiurl", header: "URL de Institución", size: 250 }, // NUEVO CAMPO AÑADIDO
    {
      accessorKey: "instistatus",
      header: "Estado",
      size: 100,
      Cell: ({ cell }) => (cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"),
    },
  ]

  // Configuración para el importador
  const fieldConfigs = {
    insticodigo: { required: true, key: true },
    instidescri: { required: true },
    instiurl: { required: false }, // NUEVO CAMPO AÑADIDO PARA CSV
    instistatus: { required: false },
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Gestión de Instituciones</b>
        </div>

        <CustomBackdrop isLoading={isDeleting} />

        <StyledRoot>
          <ModalImportCSV
            open={openImportModal}
            onClose={() => setOpenImportModal(false)}
            templateFileName="Plantilla_Instituciones.csv"
            fieldConfigs={fieldConfigs}
            validateEndpoint="/Instituciones/validarInstitucionesIMP"
            insertEndpoint="/Instituciones/insertarInstitucionesIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["Instituciones"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/Instituciones/getAllInstituciones"
            errorMsgFilterSearch="Error al cargar los datos de instituciones"
            queryKeyModal="Instituciones"
            perPage={10}
            rowActionsWidthTable={120}
            columnsTable={columnsTable}
            rowActions={(row) => {
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a?.acccaption === "EDITAR")
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a?.acccaption === "ELIMINAR")

              return [
                {
                  label: editarAction?.acccaption || "Editar",
                  key: "EDITAR",
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: (row) => navigate("editar", { state: row.original }),
                },
                {
                  label: eliminarAction?.acccaption || "Eliminar",
                  key: "ELIMINAR",
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    try {
                      await SaveEliminacion(row.original)
                    } catch (err) {
                      console.error(err)
                    }
                  },
                },
              ]
            }}
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
                        const title = "Reporte de Instituciones"
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
                        handleAllExportDataCSV(data, `Instituciones ${new Date().toLocaleString()}`),
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

export default Instituciones

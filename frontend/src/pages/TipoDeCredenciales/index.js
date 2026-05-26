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

const TipoDeCredenciales = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openImportModal, setOpenImportModal] = useState(false)

  // Mutación para eliminación
  const { mutateAsync: SaveEliminacion, isPending: isDeleting } = useMutation({
    queryKey: ["isDeletingCredencial"],
    fn: async (data) => {
      const response = await api.post("/TipoDeCredenciales/eliminarTipoDeCredenciales", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["TipoDeCredenciales"] })
    },
  })

  // Columnas de la tabla
  const columnsTable = [
    { accessorKey: "clacodigo", header: "Código", size: 100 },
    { accessorKey: "cladescri", header: "Descripción", size: 300 },
    {
      accessorKey: "clastatus",
      header: "Estado",
      size: 100,
      Cell: ({ cell }) => (cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"),
    },
  ]

  // Configuración para el importador
  const fieldConfigs = {
    clacodigo: { required: true, key: true },
    cladescri: { required: true },
    clastatus: { required: false },
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Gestión de Tipo de Credenciales</b>
        </div>

        <CustomBackdrop isLoading={isDeleting} />

        <StyledRoot>
          <ModalImportCSV
            open={openImportModal}
            onClose={() => setOpenImportModal(false)}
            templateFileName="Plantilla_TiposCredenciales.csv"
            fieldConfigs={fieldConfigs}
            validateEndpoint="/TipoDeCredenciales/validarTipoDeCredencialesIMP"
            insertEndpoint="/TipoDeCredenciales/insertarTipoDeCredencialesIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["TipoDeCredenciales"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/TipoDeCredenciales/getAllTipoDeCredenciales"
            errorMsgFilterSearch="Error en cargar datos de credenciales"
            queryKeyModal="TipoDeCredenciales"
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
              const crearAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "CREAR")
              const exportarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "EXPORTAR")

              return [
                {
                  label: crearAction?.acccaption || "Crear",
                  key: "CREAR",
                  icon: getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico),
                  onClick: () => navigate("crear"),
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
                      onClick: ({ columns, data }) => {
                        device === "sm"
                          ? handleExportDataPdfSMScreen(columns, data, "Tipos de Credenciales", "Reporte")
                          : handleExportDataPdfLGScreen(
                              columns,
                              table.getCoreRowModel().rows,
                              "Tipos de Credenciales",
                              "Reporte",
                            )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      onClick: ({ data }) => handleAllExportDataCSV(data, "Reporte de Tipos de Credenciales"),
                    },
                  ],
                },
                {
                  label: "Importar",
                  key: "importarDropdown",
                  icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                  onClick: () => setOpenImportModal(true),
                },
              ]
            }}
          />
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default TipoDeCredenciales

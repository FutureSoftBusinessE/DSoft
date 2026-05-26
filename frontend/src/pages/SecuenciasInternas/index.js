import React, { useState, useContext } from "react"
import { ThemeProvider, createTheme, styled } from "@mui/material/styles"
import { Box } from "@mui/material"
import { useNavigate } from "react-router-dom"
import Header from "../../layouts/Header"
import BackIcon from "../../components/BackIcon"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import ModalImportCSV from "../../components/CustomCSVImportButton"
import { GlobalContext } from "../../contexts/GlobalContext"

// TanStack Query y API
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

const SecuenciasInternas = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openImportModal, setOpenImportModal] = useState(false)

  // Mutación para eliminación con llave primaria compuesta (locservidor, seccodigo)
  const { mutateAsync: SaveEliminacionSecuencia, isPending: isDeleting } = useMutation({
    queryKey: ["isDeletingSecuencia"],
    fn: async (data) => {
      const response = await api.post("/SecuenciasInternas/eliminarSecuenciasInternas", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["SecuenciasInternas"] })
    },
  })

  // Definición de las columnas de la tabla (siacsec)
  const columnsTable = [
    { accessorKey: "locservidor", header: "Servidor", size: 100 },
    { accessorKey: "seccodigo", header: "Código", size: 100 },
    {
      accessorKey: "secnumero",
      header: "Secuencia",
      size: 150,
      Cell: ({ cell }) => Number(cell.getValue()).toLocaleString(),
    },
    { accessorKey: "secdescri", header: "Descripción", size: 350 },
  ]

  // Configuración para el importador CSV
  const fieldConfigs = {
    locservidor: { required: true, key: true },
    seccodigo: { required: true, key: true },
    secnumero: { required: true },
    secdescri: { required: true },
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Gestión de Secuencias Internas</b>
        </div>

        <CustomBackdrop isLoading={isDeleting} />

        <StyledRoot>
          <ModalImportCSV
            open={openImportModal}
            onClose={() => setOpenImportModal(false)}
            templateFileName="Plantilla_SecuenciasInternas.csv"
            fieldConfigs={fieldConfigs}
            validateEndpoint="/SecuenciasInternas/validarSecuenciasInternasIMP"
            insertEndpoint="/SecuenciasInternas/insertarSecuenciasInternasIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["SecuenciasInternas"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/SecuenciasInternas/getAllSecuenciasInternas"
            errorMsgFilterSearch="Error al cargar secuencias"
            queryKeyModal="SecuenciasInternas"
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
                      await SaveEliminacionSecuencia(row.original)
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
                        const title = "Reporte de Secuencias Internas"
                        device === "sm"
                          ? handleExportDataPdfSMScreen(columns, data, title, `${title} ${new Date().toLocaleString()}`)
                          : handleExportDataPdfLGScreen(
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
                      onClick: ({ data }) =>
                        handleAllExportDataCSV(data, `Secuencias Internas ${new Date().toLocaleString()}`),
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

export default SecuenciasInternas

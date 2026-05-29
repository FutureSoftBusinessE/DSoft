import React, { useState, useContext } from "react"
import { ThemeProvider, createTheme, styled } from "@mui/material/styles"
import { Box } from "@mui/material"
import { useNavigate } from "react-router-dom"
import Header from "../../layouts/Header"
import BackIcon from "../../components/BackIcon"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import ModalImportCSV from "../../components/CustomCSVImportButton"
import { GlobalContext } from "../../contexts/GlobalContext"

// Importaciones de la lógica maestra de barras y peticiones
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

const SecuenciasDoc = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openImportModal, setOpenImportModal] = useState(false)

  // Mutación para eliminación con la lógica estricta de llave compuesta
  const { mutateAsync: SaveEliminacionSecuencia, isPending: isDeletingSecuencia } = useMutation({
    queryKey: ["isDeletingSecuencia"],
    fn: async (data) => {
      const response = await api.post("/SecuenciasDoc/eliminarSecuenciasDoc", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      // Refresca la tabla después de eliminar
      await qc.invalidateQueries({ queryKey: ["SecuenciasDoc"] })
    },
  })

  // Definición de las columnas de la tabla principal
  const columnsTable = [
    { accessorKey: "dptoanio", header: "Año", size: 80 },
    { accessorKey: "loccodigo", header: "Localidad", size: 100 },
    { accessorKey: "dptocodigo", header: "Módulo", size: 100 },
    { accessorKey: "doccodigo", header: "Documento", size: 120 },
    { accessorKey: "docdescri", header: "Desc. Documento", size: 250 },
    { accessorKey: "dptodescri", header: "Desc. Secuencia", size: 250 },
    {
      accessorKey: "dptonumsec",
      header: "Secuencia Actual",
      size: 150,
      Cell: ({ cell }) => <span style={{ fontWeight: "bold", color: "#196C87" }}>{cell.getValue()}</span>,
    },
  ]

  // Configuración estricta para el modal de importación CSV
  const fieldConfigs = {
    dptoanio: { required: true, key: true },
    loccodigo: { required: true, key: true },
    modcodigo: { required: true, key: true }, // Mapeado al módulo
    doccodigo: { required: true, key: true },
    dptodescri: { required: true },
    dptonumsec: { required: true },
    locservidor: { required: false },
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
          <b>Gestión de Secuencias de Documentos</b>
        </div>

        <CustomBackdrop isLoading={isDeletingSecuencia} />

        <StyledRoot>
          {/* Modal de Importación CSV integrado */}
          <ModalImportCSV
            open={openImportModal}
            onClose={() => setOpenImportModal(false)}
            templateFileName="Plantilla_SecuenciasDoc.csv"
            fieldConfigs={fieldConfigs}
            validateEndpoint="/SecuenciasDoc/validarSecuenciasDocIMP"
            insertEndpoint="/SecuenciasDoc/insertarSecuenciasDocIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["SecuenciasDoc"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/SecuenciasDoc/getAllSecuenciasDoc"
            errorMsgFilterSearch="Error al cargar las secuencias"
            queryKeyModal="SecuenciasDoc"
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
                    // Viaja toda la fila original a la pantalla de edición
                    navigate("editar", { state: row.original })
                  },
                },
                {
                  label: eliminarAction?.acccaption || "Eliminar",
                  key: eliminarAction?.acccaption || "ELIMINAR",
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    try {
                      // Construimos el payload con la llave compuesta exacta requerida por el backend
                      const payload = {
                        dptoanio: row.original.dptoanio,
                        loccodigo: row.original.loccodigo,
                        modcodigo: row.original.dptocodigo, // Backend espera 'modcodigo'
                        doccodigo: row.original.doccodigo,
                        locservidor: row.original.locservidor || "A",
                      }
                      await SaveEliminacionSecuencia(payload)
                    } catch (err) {
                      console.error("Error eliminando la secuencia de documento:", err)
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
                            "Reporte de Secuencias de Documentos",
                            `Reporte de Secuencias de Documentos ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Secuencias de Documentos",
                          `Reporte de Secuencias de Documentos ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte_Secuencias_Documentos_${new Date().toLocaleString()}`)
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

export default SecuenciasDoc

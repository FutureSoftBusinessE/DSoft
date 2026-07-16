import { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box } from "@mui/material"
import BackIcon from "../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import normalFormatDate from "../utils/date/DDMMYYYFormatDate"
import { GlobalContext } from "../../contexts/GlobalContext"
import { useMutation, api } from "../../api"
import getIconComponent from "../utils/getIconComponent"
import CustomBackdrop from "../../components/CustomBackdrop"
import { useQueryClient } from "@tanstack/react-query"
import {
  handleExportDataPdfLGScreen,
  handleExportDataPdfSMScreen,
  handleAllExportDataCSV,
} from "../utils/reactTableActions/exportToolbarActions"
import ModalImportCSV from "../../components/CustomCSVImportButton"

const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(8),
  flexGrow: 1,
  padding: "0 16px",
  height: "100vh",
}))

const theme = createTheme({
  palette: {
    primary: {
      main: "#196C87",
    },
    secondary: {
      main: "#196C87",
    },
  },
})

const FormasDeCobro = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionFormaDeCobro, isPending: isDeletingFormaDeCobro } = useMutation({
    queryKey: ["isDeletingFormaDeCobro"],
    fn: async (data) => {
      // Llamada a la API de eliminación apuntando al archivo eliminarFormasDeCobro.py
      const response = await api.post("/FormasDeCobro/eliminarFormasDeCobro", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["FormasDeCobro"] })
    },
  })

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
          <b>Gestión de Formas de Cobro</b>
        </div>

        <CustomBackdrop isLoading={isDeletingFormaDeCobro} />

        <Box className={StyledRoot}>
          {/* MODAL DE IMPORTACIÓN CSV */}
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="Plantilla_FormasDeCobro.csv"
            fieldConfigs={{
              factippag: { required: true, key: true }, // Llave primaria de la tabla (junto con ciacodigo en BD)
              fordescri: { required: true },
              fordias: { required: true },
              fortipo: { required: true },
              forcuotas: { required: true },
              forstatus: { required: false }, // Opcional, asumimos 'A' por defecto
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/FormasDeCobro/validarFormasDeCobroIMP"
            insertEndpoint="/FormasDeCobro/insertarFormasDeCobroIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["FormasDeCobro"] })}
          />

          {/* GRILLA PRINCIPAL */}
          <CustomConditionalActionsTableServer
            endpoint="/FormasDeCobro/getAllFormasDeCobro"
            errorMsgFilterSearch="Error al cargar datos de Formas de Cobro"
            queryKeyModal="FormasDeCobro"
            perPage={10}
            rowActionsWidthTable={120}
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
                      await SaveEliminacionFormaDeCobro(row.original)
                    } catch (err) {
                      console.error("Error eliminando la Forma de Cobro:", err)
                    }
                  },
                },
              ]

              return actions
            }}
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
                            "Reporte de Formas de Cobro",
                            `Reporte_Formas_Cobro_${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Formas de Cobro",
                          `Reporte_Formas_Cobro_${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte_Formas_Cobro_${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                },
                {
                  label: "Importar",
                  key: "importarDropdown",
                  icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                  onClick: () => {
                    setOpenModal(true)
                  },
                },
              ]
              return toolbarActions
            }}
            columnsTable={[
              {
                accessorKey: "factippag",
                header: "Cód. Cobro",
                size: 110,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "fordescri",
                header: "Descripción",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "fordias",
                header: "Días Plazo",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "forcuotas",
                header: "Nro. Cuotas",
                size: 110,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "forstatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => {
                  const valor = cell.getValue()
                  return <span>{valor === "A" ? "ACTIVO" : "INACTIVO"}</span>
                },
              },
              {
                accessorKey: "forfecisys",
                header: "Fecha de Creación",
                size: 180,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span>
                },
              },
              {
                accessorKey: "forusuisys",
                header: "Creado Por",
                size: 130,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "forfecmsys",
                header: "Fecha de Mod.",
                size: 180,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span>
                },
              },
              {
                accessorKey: "forusumsys",
                header: "Modificado Por",
                size: 130,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default FormasDeCobro

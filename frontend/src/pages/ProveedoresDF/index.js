import { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { Box } from "@mui/material"
import BackIcon from "../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
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

const StyledRootStyles = {
  display: "flex",
  flexDirection: "column",
  marginTop: "64px",
  flexGrow: 1,
  padding: "0 16px",
  height: "100vh",
}

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#196C87" } },
})

const ProveedoresDF = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionProveedor, isPending: isDeleting } = useMutation({
    queryKey: ["isDeletingProveedorDF"],
    fn: async (data) => (await api.post("/ProveedoresDF/eliminarProveedoresDF", data)).data,
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ProveedoresDF"] }),
  })

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Mantenimiento de Proveedores</b>
        </div>

        <CustomBackdrop isLoading={isDeleting} />

        <Box sx={StyledRootStyles}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCargaProveedores.csv"
            fieldConfigs={{
              "Tipo de Identificacion": { required: true },
              "Cedula o Ruc": { required: true, key: true },
              Nombre: { required: true },
              "Razon Social": { required: false },
              Direccion: { required: true },
              Email: { required: false },
              Telefono: { required: false },
              Celular: { required: false },
              Estado: { required: false },
            }}
            validateEndpoint="/ProveedoresDF/validarProveedoresDFIMP"
            insertEndpoint="/ProveedoresDF/insertarProveedoresDFIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["ProveedoresDF"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/ProveedoresDF/getAllProveedoresDF"
            queryKeyModal="ProveedoresDF"
            perPage={10}
            rowActionsWidthTable={120}
            rowActions={(row) => {
              const acciones = selectedMenuInfo?.data?.barraAcciones || []
              const actions = []
              const editA = acciones.find((a) => a.acccaption === "EDITAR")
              const elimA = acciones.find((a) => a.acccaption === "ELIMINAR")

              if (editA)
                actions.push({
                  label: editA.acccaption,
                  key: "edit",
                  icon: getIconComponent(editA.accnameicono, editA.acctipoico),
                  onClick: (row) => navigate("editar", { state: row.original }),
                })
              if (elimA)
                actions.push({
                  label: elimA.acccaption,
                  key: "delete",
                  icon: getIconComponent(elimA.accnameicono, elimA.acctipoico),
                  onClick: async (row) => {
                    try {
                      await SaveEliminacionProveedor(row.original)
                    } catch (e) {}
                  },
                })
              return actions
            }}
            topToolbarCustomActions={({ table, device }) => {
              const acciones = selectedMenuInfo?.data?.barraAcciones || []
              const toolbarActions = []
              const crearA = acciones.find((a) => a.acccaption === "CREAR")
              const expA = acciones.find((a) => a.acccaption === "EXPORTAR")
              const impA = acciones.find((a) => a.acccaption === "IMPORTAR")

              if (crearA)
                toolbarActions.push({
                  label: crearA.acccaption,
                  key: "crearBtn",
                  icon: getIconComponent(crearA.accnameicono, crearA.acctipoico),
                  onClick: () => navigate("crear"),
                })
              if (expA)
                toolbarActions.push({
                  type: "dropdown",
                  label: expA.acccaption,
                  key: "exportDropdown",
                  icon: getIconComponent(expA.accnameicono, expA.acctipoico),
                  actions: [
                    {
                      label: "PDF",
                      key: "pdf",
                      icon: getIconComponent(expA.accnameicono, expA.acctipoico),
                      onClick: ({ columns, data }) =>
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Maestro de Proveedores",
                          "Maestro de Proveedores",
                        ),
                    },
                    {
                      label: "CSV",
                      key: "csv",
                      icon: getIconComponent(expA.accnameicono, expA.acctipoico),
                      onClick: ({ data }) => handleAllExportDataCSV(data, "Proveedores_SIAC"),
                    },
                  ],
                })
              if (impA)
                toolbarActions.push({
                  label: impA.acccaption,
                  key: "importBtn",
                  icon: getIconComponent(impA.accnameicono || "UploadFile", impA.acctipoico || "MaterialIcons"),
                  onClick: () => setOpenModal(true),
                })
              return toolbarActions
            }}
            columnsTable={[
              { accessorKey: "procodigo", header: "Cód. Sistema", size: 100 },
              { accessorKey: "Cedula o Ruc", header: "Cédula / R.U.C.", size: 150 },
              { accessorKey: "Nombre", header: "Nombre", size: 250 },
              { accessorKey: "Direccion", header: "Dirección", size: 250 },
              { accessorKey: "Email", header: "Email", size: 200 },
              {
                accessorKey: "Estado",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default ProveedoresDF

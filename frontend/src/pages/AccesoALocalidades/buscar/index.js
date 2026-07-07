import React, { useState, useEffect } from "react"
import Header from "../../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material"
import { useLocation, useNavigate } from "react-router-dom"
import BackIcon from "../../../components/BackIcon"
import { useQuery, useMutation } from "@tanstack/react-query"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"
import Swal from "sweetalert2"

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

// ==================== DATOS FAKE ====================

const permisosLabels = {
  usrflagcaj: "Cajero Facturador",
  usrcajdesc: "Máximo % de Descuento autorizado al Cajero en Facturación",
  usrflagsup: "Supervisor",
  usrsupdesc: "Máximo % de Descuento autorizado al Supervisor en Facturación",
  usrflagger: "Gerente",
  usrgerdesc: "Máximo % de Descuento autorizado al Gerente en Facturación",
  usrmonaprocom: "Máximo Monto autorizado para Aprobación en Cuentas por Pagar/Compras e Importaciones",
  usrflaganuped: "Supervisor Anula Pedidos Aprobados en Facturación",
  usrflaganufac: "Anula Facturas Restringiendo Fechas",
  usrflageliant: "Elimina Anticipos NO APLICADOS en Cuentas por Cobrar",
  usrflagelicob: "Elimina Cobros Restringiendo Fechas en Cuentas por Cobrar",
  usrflagemiped: "Modifica Fecha de Emisión de Pedidos de Clientes",
  usrflagemifac: "Modifica Fecha de Emisión de Facturas de Clientes",
  usrflagemicob: "Modifica Fecha de Emisión de Cobros a la Vista en Cuentas por Cobrar",
  usrflagemiab: "Modifica Fecha de Emisión de Anticipos en Cuentas por Cobrar",
  usrflagemincd: "Modifica Fecha de Emisión de Notas de Crédito por Devolución en Cuentas por Cobrar",
  usrflagemincm: "Modifica Fecha de Emisión de Notas de Crédito por Monto en Cuentas por Cobrar",
  usrflagemidg: "Modifica Fecha de Emisión de Documentos en Garantía en Cuentas por Cobrar",
  usrflagemind: "Modifica Fecha de Emisión de Notas de Débito en Cuentas por Cobrar",
  usrflagemitrainv: "Modifica Fecha de Emisión de Transacciones en Inventarios",
  usrflagemicominv: "Modifica Fecha de Emisión de Compras de Inventarios en Compras e Importaciones",
  usrflagemicomser: "Modifica Fecha de Emisión de Compras de Servicios en Compras e Importaciones",
  usrflagemigasaso: "Modifica Fecha de Emisión de Gastos Asociados en Compras e Importaciones",
  usrflagemipagpro: "Modifica Fecha de Emisión de Pago a Proveedores en Cuentas por Pagar",
  usrflagemipagdir: "Modifica Fecha de Emisión de Pago Directo en Cuentas por Pagar",
  usrflagemiantpro: "Modifica Fecha de Emisión de Anticipo a Proveedores en Cuentas por Pagar",
  usrflaganuordcom: "Aprueba/Anula Orden de Compra",
  usrflaganugasaso: "Aprueba/Anula Gasto Asociado",
  usrflaganupagpro: "Anula Pago a Proveedores",
  usrflaganupagdir: "Anula Pago Directo",
  usrflaganucheque: "Anula Anticipos - Viáticos - Reposición de Caja Chica",
  usrflagemicobrel: "Modifica Porcentaje de Descuento en Proforma de Cliente",
  usrflagemindmor: "Modifica Precios de Venta en Proforma de Cliente",
  usrflagemindref: "Puede Ver Rentabilidad en Consultas/Reportes de Ventas en Facturación",
  usrflagemindces: "Modifica parámetros de Venta en el Mantenimiento del Cliente",
  usrflagivapedido: "Puede Ver Costos de Productos en Facturación",
  usrflagvencedg: "Modifica Fecha de Vencimiento de Documentos en Garantía",
  usrflagvencegift: "Modifica Fecha de Vencimiento de GiftCard",
  usrflagemifaccxp: "Modifica Fecha de Ingreso de Facturas de Proveedores",
  usrflagemindcxp: "Modifica Fecha de Ingreso de Notas de Débito de Proveedores",
  usrflageminccxp: "Modifica Fecha de Ingreso de Notas de Crédito de Proveedores",
  usrflagmodcredito: "Modifica parámetros para otorgar Crédito a Clientes",
  usrmontolineacre: "Máximo Monto autorizado para otorgar Líneas de Crédito a Clientes en Cuentas por Cobrar",
  usrflagaprproyecto: "Aprueba Proyectos en Facturación",
  usrflagcrucecta: "Cruce de Cuentas Contables en Pago a Proveedores y Cobro de Clientes",
  usrflaganuproforma: "Anula Proforma de Clientes",
  usrflagclicomenta: "Modifica Observación del Cliente",
  usrflagclicreahis: "Crea Observación en el Historial del Cliente",
  usrflagclielihis: "Elimina Observación en el Historial del Cliente",
  usrflagrentabilidadped: "Puede Ver Rentabilidad en Emisión/Consulta de Proformas",
  usrflagdescuentoglobal: "Puede Ingresar Descuentos Globales en Proformas de Clientes",
  usrflagvercostoinvcomp: "Puede Ver Costos de Productos en Inventarios/Compras e Importaciones",
  usrflagmodificaarticulo: "Puede Modificar Descripción del Artículo en la Proforma de Clientes",
}

const fieldTypes = {
  // Booleanos
  usrflagcaj: "boolean",
  usrflagsup: "boolean",
  usrflagger: "boolean",
  usrflaganuped: "boolean",
  usrflaganufac: "boolean",
  usrflageliant: "boolean",
  usrflagelicob: "boolean",
  usrflagemiped: "boolean",
  usrflagemifac: "boolean",
  usrflagemicob: "boolean",
  usrflagemiab: "boolean",
  usrflagemincd: "boolean",
  usrflagemincm: "boolean",
  usrflagemidg: "boolean",
  usrflagemind: "boolean",
  usrflagemitrainv: "boolean",
  usrflagemicominv: "boolean",
  usrflagemicomser: "boolean",
  usrflagemigasaso: "boolean",
  usrflagemipagpro: "boolean",
  usrflagemipagdir: "boolean",
  usrflagemiantpro: "boolean",
  usrflaganuordcom: "boolean",
  usrflaganugasaso: "boolean",
  usrflaganupagpro: "boolean",
  usrflaganupagdir: "boolean",
  usrflaganucheque: "boolean",
  usrflagemicobrel: "boolean",
  usrflagemindmor: "boolean",
  usrflagemindref: "boolean",
  usrflagemindces: "boolean",
  usrflagivapedido: "boolean",
  usrflagvencedg: "boolean",
  usrflagvencegift: "boolean",
  usrflagemifaccxp: "boolean",
  usrflagemindcxp: "boolean",
  usrflageminccxp: "boolean",
  usrflagmodcredito: "boolean",
  usrflagaprproyecto: "boolean",
  usrflagcrucecta: "boolean",
  usrflaganuproforma: "boolean",
  usrflagclicomenta: "boolean",
  usrflagclicreahis: "boolean",
  usrflagclielihis: "boolean",
  usrflagrentabilidadped: "boolean",
  usrflagdescuentoglobal: "boolean",
  usrflagvercostoinvcomp: "boolean",
  usrflagmodificaarticulo: "boolean",
  // Numéricos
  usrcajdesc: "numeric",
  usrsupdesc: "numeric",
  usrgerdesc: "numeric",
  usrmonaprocom: "numeric",
  usrmontolineacre: "numeric",
}

const transformarADiccionario = (permisosArray) => {
  const dict = {}

  permisosArray.forEach((perm) => {
    const key = perm.loccodigo

    dict[key] = {
      ...perm,
      // Convertir strings numéricos a números
      usrcajdesc: parseFloat(perm.usrcajdesc) || 0,
      usrsupdesc: parseFloat(perm.usrsupdesc) || 0,
      usrgerdesc: parseFloat(perm.usrgerdesc) || 0,
      usrmonaprocom: parseFloat(perm.usrmonaprocom) || 0,
      usrmontolineacre: parseFloat(perm.usrmontolineacre) || 0,

      // Campos booleanos (ya vienen como -1/0)

      // Campo selected para frontend
      selected: perm.locaccion !== "DELETE" && perm.locaccion !== "CREATE",
    }
  })

  return dict
}

// ==================== COMPONENTE PRINCIPAL ====================

const AccesoALocalidadesBuscar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { usrcodigo, ciacodigo, ciadescri } = location.state

  const [permisos, setPermisos] = useState({})

  const {
    data: dataLocalidades = [],
    isLoading: isLoadingLocalidades,
    isError: isErrorLocalidades,
    isRefetching: isRefetchingLocalidades,
  } = useGetLocalidades()

  function useGetLocalidades() {
    return useQuery({
      queryKey: ["AccesoALocalidadesBuscarLocalidades"],
      queryFn: async () => {
        const response = await fetchwrapper(`/AccesoALocalidades/getLocalidadesByCompania`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ciacodigo }),
        })
        const result = await response.json()
        return result.data
      },
    })
  }

  const {
    data: dataPermisos = [],
    isLoading: isLoadingPermisos,
    isError: isErrorPermisos,
    isRefetching: isRefetchingPermisos,
  } = useGetPermisos()

  function useGetPermisos() {
    return useQuery({
      queryKey: ["AccesoALocalidadesBuscarPermisos"],
      queryFn: async () => {
        try {
          const response = await fetchwrapper("/AccesoALocalidades/getPermisosByUsuarioCompania", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ciacodigo,
              usrcodigo,
            }),
          })
          const result = await response.json()
          return result.data
        } catch (errorResponse) {
          Swal.fire({
            title: "Error",
            text: errorResponse?.details?.msg || "Error al obtener permisos del usuario",
            icon: "error",
            confirmButtonText: "OK",
          })
          throw new Error(errorResponse?.details?.msg || "Error al obtener permisos del usuario")
        }
      },
      keepPreviousData: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    })
  }

  useEffect(() => {
    if (dataPermisos.length > 0) {
      setPermisos(transformarADiccionario(dataPermisos))
    }
  }, [dataPermisos])

  const { mutateAsync: savePermisos, isPending: isSavingPermisos } = useSavePermisos()

  function useSavePermisos() {
    return useMutation({
      mutationFn: async (data) => {
        const options = {
          method: "POST",
          body: JSON.stringify({ permisos: data, ciacodigo }),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }

        try {
          const response = await fetchwrapper(`/AccesoALocalidades/guardarPermisosLocalidades`, options)
          const result = await response.json()
          return result?.data
        } catch (errorResponse) {
          throw errorResponse?.details?.msg || "Error al ejecutar la accion"
        }
      },
    })
  }

  // ✅ LOGICA CORRECTA PARA SELECTION CON CAMPO 'selected'
  const handleSelectionChange = (loccodigo, checked) => {
    setPermisos((prev) => {
      const current = prev[loccodigo]

      if (current.locaccion === "CREATE") {
        // CREATE: No existe en BD
        if (checked) {
          // Marcar CREATE → sigue CREATE con selected=true
          return {
            ...prev,
            [loccodigo]: {
              ...current,
              selected: true,
            },
          }
        } else {
          // Desmarcar CREATE → sigue CREATE con selected=false
          return {
            ...prev,
            [loccodigo]: {
              ...current,
              selected: false,
            },
          }
        }
      } else if (current.locaccion === "UPDATE") {
        // UPDATE: Ya existe en BD
        if (!checked) {
          // Desmarcar UPDATE → DELETE (selected=false)
          return {
            ...prev,
            [loccodigo]: {
              ...current,
              locaccion: "DELETE",
              selected: false,
            },
          }
        }
        // Marcar UPDATE → sigue UPDATE
        return prev
      } else if (current.locaccion === "DELETE") {
        // DELETE: Registro marcado para eliminar
        if (checked) {
          // Marcar DELETE → UPDATE (selected=true)
          return {
            ...prev,
            [loccodigo]: {
              ...current,
              locaccion: "UPDATE",
              selected: true,
            },
          }
        }
        // Desmarcar DELETE → sigue DELETE
        return prev
      }

      return prev
    })
  }

  // Cambiar permisos booleanos
  const handleBooleanChange = (loccodigo, field, checked) => {
    setPermisos((prev) => ({
      ...prev,
      [loccodigo]: {
        ...prev[loccodigo],
        [field]: checked ? -1 : 0,
        locaccion: prev[loccodigo].locaccion === "CREATE" ? "CREATE" : "UPDATE",
        // Si se modifica un permiso y es CREATE, asegurar que selected=true
        selected: prev[loccodigo].locaccion === "CREATE" ? true : prev[loccodigo].selected,
      },
    }))
  }

  // Cambiar permisos numéricos
  const handleNumericChange = (loccodigo, field, value) => {
    setPermisos((prev) => ({
      ...prev,
      [loccodigo]: {
        ...prev[loccodigo],
        [field]: parseFloat(value) || 0,
        locaccion: prev[loccodigo].locaccion === "CREATE" ? "CREATE" : "UPDATE",
        // Si se modifica un permiso y es CREATE, asegurar que selected=true
        selected: prev[loccodigo].locaccion === "CREATE" ? true : prev[loccodigo].selected,
      },
    }))
  }

  // Simular guardado
  const handleSave = async () => {
    console.log("=== DATOS A GUARDAR ===")
    const permisosAGuardar = Object.entries(permisos).filter(
      ([_, perm]) => perm.locaccion === "DELETE" || perm.selected,
    )
    console.log(permisosAGuardar, "permisosAGuardar")

    try {
      const response = await savePermisos(permisosAGuardar.map(([_, perm]) => perm))

      const msgExito = response?.msg || "Permisos guardado con éxito"

      Swal.fire({
        title: "Éxito",
        text: msgExito,
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
        navigate(-1)
      })
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err,
        icon: "error",
        confirmButtonText: "OK",
      })
    }
  }

  const renderRow = (field, label) => {
    const fieldType = fieldTypes[field]

    return (
      <TableRow key={field}>
        <TableCell
          component="th"
          scope="row"
          sx={{
            fontWeight: field === "SELECTION" || field === "ACCION" ? "bold" : "normal",
            backgroundColor: field === "SELECTION" || field === "ACCION" ? "#f5f5f5" : "transparent",
          }}
        >
          {label}
        </TableCell>
        {dataLocalidades.map((loc) => {
          const perm = permisos[loc.loccodigo]
          if (!perm) return <TableCell key={loc.loccodigo}>-</TableCell>

          if (field === "SELECTION") {
            // ✅ LOGICA SIMPLE: usar el campo 'selected'
            const isChecked = perm.selected

            return (
              <TableCell key={loc.loccodigo}>
                <Checkbox
                  checked={isChecked}
                  onChange={(e) => handleSelectionChange(loc.loccodigo, e.target.checked)}
                  color="primary"
                />
              </TableCell>
            )
          }

          if (field === "ACCION") {
            const getEstadoColor = (estado) => {
              switch (estado) {
                case "CREATE":
                  return "#ff9800"
                case "UPDATE":
                  return "#2196f3"
                case "DELETE":
                  return "#f44336"
                default:
                  return "#757575"
              }
            }

            return (
              <TableCell key={loc.loccodigo}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    color: getEstadoColor(perm.locaccion),
                    fontStyle: perm.locaccion === "CREATE" ? "italic" : "normal",
                  }}
                >
                  {perm.locaccion}
                </Typography>
              </TableCell>
            )
          }

          if (fieldType === "boolean") {
            return (
              <TableCell key={loc.loccodigo}>
                <Checkbox
                  checked={perm[field] === -1}
                  onChange={(e) => handleBooleanChange(loc.loccodigo, field, e.target.checked)}
                  disabled={perm.locaccion === "DELETE"}
                  color="primary"
                />
              </TableCell>
            )
          }

          if (fieldType === "numeric") {
            return (
              <TableCell key={loc.loccodigo}>
                <TextField
                  type="number"
                  size="small"
                  value={perm[field]}
                  onChange={(e) => handleNumericChange(loc.loccodigo, field, e.target.value)}
                  disabled={perm.locaccion === "DELETE"}
                  sx={{ width: "100px" }}
                  inputProps={{
                    step: "0.01",
                    style: { textAlign: "right" },
                    min: "0",
                  }}
                />
              </TableCell>
            )
          }

          return <TableCell key={loc.loccodigo}>-</TableCell>
        })}
      </TableRow>
    )
  }

  const camposAMostrar = [
    { field: "SELECTION", label: "SELECTION" },
    { field: "ACCION", label: "ACCION" },
    ...Object.entries(permisosLabels).map(([field, label]) => ({ field, label })),
  ]

  // if (loading) {
  //   return (
  //     <ThemeProvider theme={theme}>
  //       <Header />
  //       <div className="main main-app p-3 p-lg-4">
  //         <BackIcon />
  //         <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
  //           <CircularProgress />
  //           <Typography sx={{ ml: 2 }}>Cargando permisos...</Typography>
  //         </Box>
  //       </div>
  //     </ThemeProvider>
  //   )
  // }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <CustomBackdrop
          isLoading={isLoadingLocalidades || isRefetchingLocalidades || isLoadingPermisos || isRefetchingPermisos}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 30px 30px 30px",
            fontSize: "25px",
          }}
        >
          <b>Acceso a localidades</b>
        </div>

        <StyledRoot>
          <Box mb={3} p={2} sx={{ backgroundColor: "#f8f9fa", borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Usuario: <strong>{usrcodigo}</strong>
            </Typography>
            <Typography variant="body1">
              Compañía:{" "}
              <strong>
                {ciacodigo} - {ciadescri}
              </strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {dataLocalidades.length} localidades encontradas
            </Typography>
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              maxHeight: "90vh",
              overflow: "auto",
              border: "1px solid #e0e0e0",
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}>Parámetro</TableCell>
                  {dataLocalidades.map((loc) => (
                    <TableCell key={loc.loccodigo} sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}>
                      {loc.loccodigo} - {loc.locdescri}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>{camposAMostrar.map(({ field, label }) => renderRow(field, label))}</TableBody>
            </Table>
          </TableContainer>

          <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" color="secondary" onClick={() => window.history.back()}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={isSavingPermisos}
              startIcon={isSavingPermisos ? <CircularProgress size={20} /> : null}
            >
              {isSavingPermisos ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </Box>
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default AccesoALocalidadesBuscar

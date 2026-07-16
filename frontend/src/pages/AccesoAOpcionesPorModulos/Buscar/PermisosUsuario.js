// PermisosUsuario.jsx - VERSIÓN CORREGIDA
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Paper,
  Checkbox,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Snackbar,
  Collapse,
  Grid,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"
import {
  ExpandMore,
  ExpandLess,
  Security,
  Save,
  CheckBox,
  CheckBoxOutlineBlank,
  Close,
  Refresh,
  ArrowUpward,
  Warning,
} from "@mui/icons-material"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useNavigate, useLocation } from "react-router-dom"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import Swal from "sweetalert2"

// ==============================================
// HOOK: usePermisosManager
// ==============================================
const usePermisosManager = (initialData = null) => {
  const [permisos, setPermisos] = useState({
    opciones: new Map(),
    permisosMap: new Map(),
    hijos: new Map(),
    relaciones: {},
    raiz: "root",
  })

  const [expandidos, setExpandidos] = useState(new Set())

  useEffect(() => {
    if (initialData && initialData.opciones && Array.isArray(initialData.opciones)) {
      const opcionesMap = new Map()
      const permisosMap = new Map()
      const hijosMap = new Map()

      initialData.opciones.forEach((opcion) => {
        if (opcion && opcion.opctag) {
          opcionesMap.set(opcion.opctag, {
            ...opcion,
            permiso: Boolean(opcion.permiso),
            nivel: Number(opcion.nivel) || 0,
            esHoja: Boolean(opcion.esHoja),
          })
          permisosMap.set(opcion.opctag, Boolean(opcion.permiso))
        }
      })

      if (initialData.relaciones && typeof initialData.relaciones === "object") {
        Object.entries(initialData.relaciones).forEach(([padre, hijos]) => {
          if (Array.isArray(hijos)) {
            hijosMap.set(padre, hijos)
          }
        })
      }

      if (!hijosMap.has("root")) {
        hijosMap.set("root", [])
      }

      const opcionesNivel0 = Array.from(opcionesMap.values())
        .filter((op) => op.nivel === 0)
        .map((op) => op.opctag)

      const rootHijosActuales = hijosMap.get("root") || []
      const nuevosRootHijos = [...new Set([...rootHijosActuales, ...opcionesNivel0])]
      hijosMap.set("root", nuevosRootHijos.sort())

      setPermisos({
        opciones: opcionesMap,
        permisosMap,
        hijos: hijosMap,
        relaciones: initialData.relaciones || {},
        raiz: initialData.raiz || "root",
      })
    }
  }, [initialData])

  const toggleOpcion = useCallback((opctag, nuevoEstado) => {
    setPermisos((prev) => {
      const nuevosPermisos = new Map(prev.permisosMap)
      const opcionesAActualizar = new Set([opctag])

      const obtenerHijosRecursivo = (padre) => {
        const hijos = prev.hijos.get(padre) || []
        hijos.forEach((hijo) => {
          opcionesAActualizar.add(hijo)
          obtenerHijosRecursivo(hijo)
        })
      }

      obtenerHijosRecursivo(opctag)

      opcionesAActualizar.forEach((opc) => {
        nuevosPermisos.set(opc, nuevoEstado)
      })

      return {
        ...prev,
        permisosMap: nuevosPermisos,
      }
    })
  }, [])

  const obtenerEstadoOpcion = useCallback(
    (opctag) => {
      try {
        const hijos = permisos.hijos.get(opctag) || []

        if (hijos.length === 0) {
          return permisos.permisosMap.get(opctag) || false
        }

        let todosPermitidos = true
        let algunPermitido = false

        for (const hijo of hijos) {
          const permisoHijo = permisos.permisosMap.get(hijo)
          if (!permisoHijo) todosPermitidos = false
          if (permisoHijo) algunPermitido = true
        }

        if (todosPermitidos) return true
        if (algunPermitido) return "indeterminate"
        return false
      } catch (error) {
        return false
      }
    },
    [permisos],
  )

  const toggleExpandir = useCallback((opctag) => {
    setExpandidos((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(opctag)) {
        nuevo.delete(opctag)
      } else {
        nuevo.add(opctag)
      }
      return nuevo
    })
  }, [])

  const permitirTodo = useCallback(() => {
    setPermisos((prev) => {
      const nuevosPermisos = new Map()
      prev.permisosMap.forEach((_, key) => {
        nuevosPermisos.set(key, true)
      })

      return {
        ...prev,
        permisosMap: nuevosPermisos,
      }
    })
  }, [])

  const denegarTodo = useCallback(() => {
    setPermisos((prev) => {
      const nuevosPermisos = new Map()
      prev.permisosMap.forEach((_, key) => {
        nuevosPermisos.set(key, false)
      })

      return {
        ...prev,
        permisosMap: nuevosPermisos,
      }
    })
  }, [])

  const prepararDatosParaGuardar = useCallback(() => {
    const opcionesParaGuardar = []

    permisos.opciones.forEach((opcion, opctag) => {
      const permiso = permisos.permisosMap.get(opctag) || false
      opcionesParaGuardar.push({
        opctag,
        permiso,
        opccaption: opcion.opccaption,
        opccontroller: opcion.opccontroller || "",
      })
    })

    return opcionesParaGuardar
  }, [permisos])

  const estadisticas = useMemo(() => {
    let total = 0
    let permitidos = 0

    permisos.permisosMap.forEach((permiso) => {
      total++
      if (permiso === true) permitidos++
    })

    return {
      total,
      permitidos,
      denegados: total - permitidos,
    }
  }, [permisos.permisosMap])

  return {
    permisos,
    expandidos,
    toggleOpcion,
    obtenerEstadoOpcion,
    toggleExpandir,
    permitirTodo,
    denegarTodo,
    prepararDatosParaGuardar,
    estadisticas,
  }
}

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================
const PermisosUsuario = ({ usuario, esPerfil = false }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { ciacodigo, usrcodigo, usrflagperfil, modcodigo } = location?.state || {}

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })
  const [dialogoCerrarPanel, setDialogoCerrarPanel] = useState(null)
  const [accionesCargadas, setAccionesCargadas] = useState(false)

  // ==============================================
  // ESTADO DE PANELES (ORDENADOS POR APERTURA)
  // ==============================================
  const [panelesAccionesAbiertos, setPanelesAccionesAbiertos] = useState([])

  // ==============================================
  // ESTADO CENTRALIZADO DE ACCIONES
  // ==============================================
  const [accionesCache, setAccionesCache] = useState(new Map())
  const [permisosAcciones, setPermisosAcciones] = useState(new Map())
  const [cambiosPendientesAcciones, setCambiosPendientesAcciones] = useState(new Map())
  const [loadingAcciones, setLoadingAcciones] = useState(new Set())
  const [erroresAcciones, setErroresAcciones] = useState(new Map())
  const opcionesCargadasRef = useRef(new Set())

  // ==============================================
  // 1. CARGA INICIAL DE ACCIONES GUARDADAS
  // ==============================================
  useEffect(() => {
    const cargarAccionesGuardadas = async () => {
      if (!ciacodigo || !usrcodigo || !modcodigo || accionesCargadas) return

      console.log("🔄 CARGANDO ACCIONES GUARDADAS DEL USUARIO...")

      try {
        const response = await fetchwrapper("/AccesoAOpcionesPorModulos/get_acciones_usuario_modulo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ciacodigo,
            usrcodigo,
            modcodigo,
          }),
        })

        const result = await response.json()
        const accionesGuardadas = result.data || []

        console.log(`✅ ${accionesGuardadas.length} acciones guardadas encontradas`)

        if (accionesGuardadas.length > 0) {
          // Crear nuevo Map de permisos
          const nuevosPermisos = new Map()

          accionesGuardadas.forEach((accion) => {
            const key = `${accion.opctag}_${accion.acccaption}`
            nuevosPermisos.set(key, true)
          })

          // Actualizar estado
          setPermisosAcciones(nuevosPermisos)
          console.log(`📊 PermisosAcciones actualizados: ${nuevosPermisos.size} acciones`)

          // Limpiar cache para forzar recarga cuando se abran los paneles
          setAccionesCache(new Map())
          opcionesCargadasRef.current.clear()
        }

        setAccionesCargadas(true)
      } catch (error) {
        console.error("❌ Error cargando acciones guardadas:", error)
        setAccionesCargadas(true)
      }
    }

    cargarAccionesGuardadas()
  }, [ciacodigo, usrcodigo, modcodigo, accionesCargadas])

  // ==============================================
  // 2. FUNCIONES DE ACCIONES
  // ==============================================
  const cargarAccionesOpcion = useCallback(
    async (opctag) => {
      if (!opctag || opcionesCargadasRef.current.has(opctag)) {
        return accionesCache.get(opctag) || []
      }

      opcionesCargadasRef.current.add(opctag)
      setLoadingAcciones((prev) => new Set(prev).add(opctag))

      try {
        const response = await fetchwrapper("/AccesoAOpcionesPorModulos/get_acciones_opcion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ciacodigo, usrcodigo, opctag }),
        })

        const result = await response.json()
        const accionesAPI = result.data || []

        setErroresAcciones((prev) => {
          const nuevo = new Map(prev)
          nuevo.delete(opctag)
          return nuevo
        })

        console.log(`📋 Opción ${opctag}: ${accionesAPI.length} acciones de API`)

        // Para cada acción de la API, verificar si ya está permitida en permisosAcciones
        const accionesCombinadas = accionesAPI.map((accionAPI) => {
          const key = `${opctag}_${accionAPI.acccaption}`
          const estaPermitida = permisosAcciones.has(key)

          return {
            ...accionAPI,
            permiso: estaPermitida || accionAPI.permiso,
          }
        })

        // Actualizar cache
        setAccionesCache((prev) => {
          const nuevo = new Map(prev)
          nuevo.set(opctag, accionesCombinadas)
          console.log(`✅ Cache actualizado para ${opctag}: ${accionesCombinadas.length} acciones`)
          return nuevo
        })

        return accionesCombinadas
      } catch (error) {
        console.error(`❌ Error cargando acciones para ${opctag}:`, error)
        setErroresAcciones((prev) => {
          const nuevo = new Map(prev)
          nuevo.set(opctag, {
            mensaje: error.message || "Error cargando acciones",
            timestamp: Date.now(),
            intentos: (prev.get(opctag)?.intentos || 0) + 1,
          })
          return nuevo
        })

        opcionesCargadasRef.current.delete(opctag)
        return []
      } finally {
        setLoadingAcciones((prev) => {
          const nuevo = new Set(prev)
          nuevo.delete(opctag)
          return nuevo
        })
      }
    },
    [ciacodigo, usrcodigo, permisosAcciones],
  )

  const reintentarCargaAcciones = useCallback(
    async (opctag) => {
      console.log(`🔄 Reintentando carga para ${opctag}`)
      opcionesCargadasRef.current.delete(opctag)
      setErroresAcciones((prev) => {
        const nuevo = new Map(prev)
        nuevo.delete(opctag)
        return nuevo
      })

      return cargarAccionesOpcion(opctag)
    },
    [cargarAccionesOpcion],
  )

  const toggleAccion = useCallback(
    (opctag, acccaption, permitir) => {
      const key = `${opctag}_${acccaption}`
      const cambiosActuales = cambiosPendientesAcciones.get(opctag) || new Map()
      const permisosConfirmados = permisosAcciones.has(key)

      if (permitir === permisosConfirmados) {
        const nuevosCambios = new Map(cambiosActuales)
        nuevosCambios.delete(acccaption)

        if (nuevosCambios.size === 0) {
          setCambiosPendientesAcciones((prev) => {
            const nuevo = new Map(prev)
            nuevo.delete(opctag)
            return nuevo
          })
        } else {
          setCambiosPendientesAcciones((prev) => new Map(prev).set(opctag, nuevosCambios))
        }
      } else {
        const nuevosCambios = new Map(cambiosActuales)
        nuevosCambios.set(acccaption, permitir)
        setCambiosPendientesAcciones((prev) => new Map(prev).set(opctag, nuevosCambios))
      }

      // Actualizar cache temporal para mostrar cambio inmediato
      setAccionesCache((prev) => {
        const nuevo = new Map(prev)
        const acciones = nuevo.get(opctag)
        if (acciones) {
          const nuevasAcciones = acciones.map((accion) =>
            accion.acccaption === acccaption ? { ...accion, permiso: permitir } : accion,
          )
          nuevo.set(opctag, nuevasAcciones)
        }
        return nuevo
      })
    },
    [cambiosPendientesAcciones, permisosAcciones],
  )

  const toggleTodasAcciones = useCallback(
    (opctag, permitir) => {
      const acciones = accionesCache.get(opctag) || []
      const cambiosPorAplicar = new Map()

      acciones.forEach((accion) => {
        cambiosPorAplicar.set(accion.acccaption, permitir)
      })

      setCambiosPendientesAcciones((prev) => new Map(prev).set(opctag, cambiosPorAplicar))

      setAccionesCache((prev) => {
        const nuevo = new Map(prev)
        const nuevasAcciones = acciones.map((accion) => ({
          ...accion,
          permiso: permitir,
        }))
        nuevo.set(opctag, nuevasAcciones)
        return nuevo
      })
    },
    [accionesCache],
  )

  const aplicarCambiosPendientes = useCallback(
    (opctag) => {
      const cambios = cambiosPendientesAcciones.get(opctag)
      if (!cambios) return

      cambios.forEach((permitir, acccaption) => {
        const key = `${opctag}_${acccaption}`
        if (permitir) {
          setPermisosAcciones((prev) => new Map(prev).set(key, true))
        } else {
          setPermisosAcciones((prev) => {
            const nuevo = new Map(prev)
            nuevo.delete(key)
            return nuevo
          })
        }
      })

      setCambiosPendientesAcciones((prev) => {
        const nuevo = new Map(prev)
        nuevo.delete(opctag)
        return nuevo
      })
    },
    [cambiosPendientesAcciones],
  )

  const descartarCambiosPendientes = useCallback(
    (opctag) => {
      const accionesOriginales = accionesCache.get(opctag)
      if (!accionesOriginales) return

      // Restaurar desde permisosAcciones
      setAccionesCache((prev) => {
        const nuevo = new Map(prev)
        const accionesRestauradas = accionesOriginales.map((accion) => ({
          ...accion,
          permiso: permisosAcciones.has(`${opctag}_${accion.acccaption}`),
        }))
        nuevo.set(opctag, accionesRestauradas)
        return nuevo
      })

      setCambiosPendientesAcciones((prev) => {
        const nuevo = new Map(prev)
        nuevo.delete(opctag)
        return nuevo
      })
    },
    [accionesCache, permisosAcciones],
  )

  const accionEstaPermitida = useCallback(
    (opctag, acccaption) => {
      // Primero verificar cambios pendientes
      const cambios = cambiosPendientesAcciones.get(opctag)
      if (cambios && cambios.has(acccaption)) {
        return cambios.get(acccaption)
      }
      return permisosAcciones.has(`${opctag}_${acccaption}`)
    },
    [cambiosPendientesAcciones, permisosAcciones],
  )

  const prepararAccionesParaGuardar = useCallback(() => {
    const accionesParaGuardar = []

    console.log("📊 Preparando acciones para guardar...")
    console.log("PermisosAcciones totales:", permisosAcciones.size)

    permisosAcciones.forEach((_, key) => {
      const [opctag, acccaption] = key.split("_")
      const acciones = accionesCache.get(opctag)

      let accionEnCache = null
      if (acciones) {
        accionEnCache = acciones.find((a) => a.acccaption === acccaption)
      }

      accionesParaGuardar.push({
        opctag,
        acccaption,
        accnameicono: accionEnCache?.accnameicono || "",
        acctipoico: accionEnCache?.acctipoico || "",
        opccontroller: accionEnCache?.opccontroller || "",
      })
    })

    console.log(`📤 ${accionesParaGuardar.length} acciones para guardar`)
    return accionesParaGuardar
  }, [permisosAcciones, accionesCache])

  const tieneCambiosPendientes = useCallback(
    (opctag) => {
      return cambiosPendientesAcciones.has(opctag)
    },
    [cambiosPendientesAcciones],
  )

  const estadisticasAcciones = useMemo(() => {
    let totalAcciones = 0
    let accionesPermitidas = 0

    accionesCache.forEach((acciones) => {
      totalAcciones += acciones.length
      accionesPermitidas += acciones.filter((a) => a.permiso).length
    })

    return {
      totalAcciones,
      accionesPermitidas,
      accionesDenegadas: totalAcciones - accionesPermitidas,
    }
  }, [accionesCache])

  // ==============================================
  // 3. QUERY PARA PERMISOS
  // ==============================================
  const {
    data: permisosData,
    isLoading: isLoadingPermisos,
    error: errorPermisos,
    refetch: refetchPermisos,
  } = useQuery({
    queryKey: ["permisosEstructurados", ciacodigo, usrcodigo, modcodigo],
    queryFn: async () => {
      const response = await fetchwrapper("/AccesoAOpcionesPorModulos/getAllOpcionesModuloOptimizado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usrcodigo, modcodigo, ciacodigo }),
      })
      const result = await response.json()
      return result.data
    },
    enabled: !!ciacodigo && !!usrcodigo && !!modcodigo,
    onError: (error) => {
      console.error(error)
      setSnackbar({
        open: true,
        message: "Error cargando permisos",
        severity: "error",
      })
    },
  })

  const permisosManager = usePermisosManager(permisosData)

  // ==============================================
  // 4. MUTATION PARA GUARDAR
  // ==============================================
  const refreshCompleto = useCallback(() => {
    console.log("🔄 Refrescando datos completos...")

    // 1. Cerrar todos los paneles
    setPanelesAccionesAbiertos([])

    // 2. Limpiar cambios pendientes
    setCambiosPendientesAcciones(new Map())

    // 3. Limpiar cache de acciones
    setAccionesCache(new Map())
    opcionesCargadasRef.current.clear()

    // 4. Recargar permisos
    refetchPermisos()

    // 5. Recargar acciones guardadas
    setAccionesCargadas(false)

    // 6. Cerrar diálogos
    setDialogoCerrarPanel(null)

    // 7. Mostrar feedback
    setSnackbar({
      open: true,
      message: "Datos refrescados correctamente",
      severity: "info",
    })
  }, [refetchPermisos])

  const { mutateAsync: guardarPermisos, isPending: isSaving } = useMutation({
    mutationFn: async (datos) => {
      const response = await fetchwrapper("/AccesoAOpcionesPorModulos/save_permisos_completos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txtUsrCodigo: usrcodigo,
          usrflagperfil,
          updateAllPerfiles: false,
          dcbCia: ciacodigo,
          dcbMod: modcodigo,
          ...datos,
        }),
      })
      return response.json()
    },
    onSuccess: (result) => {
      console.log("✅ Guardado exitoso:", result)

      // Aplicar cambios pendientes
      cambiosPendientesAcciones.forEach((_, opctag) => {
        aplicarCambiosPendientes(opctag)
      })

      setSnackbar({
        open: true,
        message: result.data?.msg || "Permisos guardados exitosamente",
        severity: "success",
      })

      // Recargar después de guardar
      setTimeout(() => {
        refreshCompleto()
      }, 1500)
    },
    onError: (error) => {
      console.error("❌ Error al guardar:", error)
      setSnackbar({
        open: true,
        message: error.message || "Error al guardar permisos",
        severity: "error",
      })
    },
  })

  // ==============================================
  // 5. HANDLER PARA ABRIR ACCIONES
  // ==============================================
  const handleAbrirAcciones = useCallback(
    (opctag, opcionInfo) => {
      const opcion = permisosManager.permisos.opciones.get(opctag)
      if (!opcion?.esHoja) return

      const existeIndex = panelesAccionesAbiertos.findIndex((p) => p.opctag === opctag)

      if (existeIndex >= 0) {
        if (tieneCambiosPendientes(opctag)) {
          setDialogoCerrarPanel({
            opctag,
            opcionInfo: {
              opccaption: opcion.opccaption,
              nivel: opcion.nivel,
            },
          })
        } else {
          setPanelesAccionesAbiertos((prev) => prev.filter((p) => p.opctag !== opctag))
        }
      } else {
        const nuevoPanel = {
          opctag,
          timestamp: Date.now(),
          opcionInfo: {
            opccaption: opcion.opccaption,
            nivel: opcion.nivel,
            esHoja: opcion.esHoja,
          },
        }

        setPanelesAccionesAbiertos((prev) => [nuevoPanel, ...prev])

        if (!opcionesCargadasRef.current.has(opctag)) {
          cargarAccionesOpcion(opctag)
        }
      }
    },
    [permisosManager, panelesAccionesAbiertos, tieneCambiosPendientes, cargarAccionesOpcion],
  )

  // ==============================================
  // 6. HANDLERS PARA DIALOGO DE CERRAR
  // ==============================================
  const handleConfirmarCerrarPanel = useCallback(
    (opctag, aplicarCambios) => {
      if (aplicarCambios) {
        aplicarCambiosPendientes(opctag)
      } else {
        descartarCambiosPendientes(opctag)
      }

      setPanelesAccionesAbiertos((prev) => prev.filter((p) => p.opctag !== opctag))
      setDialogoCerrarPanel(null)
    },
    [aplicarCambiosPendientes, descartarCambiosPendientes],
  )

  const handleCancelarCerrarPanel = useCallback(() => {
    setDialogoCerrarPanel(null)
  }, [])

  // ==============================================
  // 7. HANDLER PARA GUARDAR
  // ==============================================

  const obtenerEstadoActualParaGuardar = useCallback(() => {
    const estado = {
      opciones: permisosManager.prepararDatosParaGuardar(),
      acciones: [],
      metadata: {
        timestamp: new Date().toISOString(),
        totalPermisosAcciones: permisosAcciones.size,
        totalCacheAcciones: accionesCache.size,
      },
    }

    // 1. Primero, acciones que ya están en permisosAcciones
    permisosAcciones.forEach((_, key) => {
      const [opctag, acccaption] = key.split("_")
      const acciones = accionesCache.get(opctag)

      let accionEnCache = null
      if (acciones) {
        accionEnCache = acciones.find((a) => a.acccaption === acccaption)
      }

      const opcionPrincipal = permisosManager.permisos.opciones.get(opctag)

      estado.acciones.push({
        opctag,
        acccaption,
        accnameicono: accionEnCache?.accnameicono || "",
        acctipoico: accionEnCache?.acctipoico || "",
        opccontroller: accionEnCache?.opccontroller || opcionPrincipal?.opccontroller || "",
      })
    })

    // 2. También incluir acciones que están en cache con permiso=true pero no en permisosAcciones
    // (esto cubre cambios pendientes que aún no se aplicaron)
    accionesCache.forEach((acciones, opctag) => {
      acciones.forEach((accion) => {
        if (accion.permiso) {
          const key = `${opctag}_${accion.acccaption}`
          if (!permisosAcciones.has(key)) {
            const opcionPrincipal = permisosManager.permisos.opciones.get(opctag)

            estado.acciones.push({
              opctag,
              acccaption: accion.acccaption,
              accnameicono: accion.accnameicono || "",
              acctipoico: accion.acctipoico || "",
              opccontroller: accion.opccontroller || opcionPrincipal?.opccontroller || "",
            })
          }
        }
      })
    })

    estado.metadata.totalAccionesEnviadas = estado.acciones.length

    console.log("📦 Estado completo para guardar:", estado.metadata)

    return estado
  }, [permisosManager, permisosAcciones, accionesCache])

  const handleGuardar = useCallback(async () => {
    try {
      // Aplicar cambios pendientes primero
      const opcionesConCambios = Array.from(cambiosPendientesAcciones.keys())
      console.log("📝 Aplicando cambios pendientes en:", opcionesConCambios)

      opcionesConCambios.forEach((opctag) => {
        aplicarCambiosPendientes(opctag)
      })

      // Obtener estado COMPLETO actual
      const estadoActual = obtenerEstadoActualParaGuardar()

      console.log("💾 Guardando:", {
        opciones: estadoActual.opciones.length,
        acciones: estadoActual.acciones.length,
      })

      // Confirmación
      const { isConfirmed } = await Swal.fire({
        title: "¿Guardar cambios?",
        html: `
        <div style="text-align: left; margin: 10px 0;">
          <p><strong>Opciones:</strong> ${estadoActual.opciones.filter((o) => o.permiso).length} de ${estadoActual.opciones.length} permitidas</p>
          <p><strong>Acciones:</strong> ${estadoActual.acciones.length} acciones permitidas</p>
          <p><small>⚠️ Se reemplazarán TODAS las acciones anteriores</small></p>
        </div>
      `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
      })

      if (!isConfirmed) return

      await guardarPermisos({
        opciones: estadoActual.opciones,
        acciones: estadoActual.acciones,
      })
    } catch (error) {
      console.error("Error guardando:", error)
    }
  }, [
    permisosManager,
    obtenerEstadoActualParaGuardar,
    guardarPermisos,
    cambiosPendientesAcciones,
    aplicarCambiosPendientes,
  ])
  // ==============================================
  // 8. COMPONENTES
  // ==============================================

  const NodoPermiso = React.memo(({ nodo, nivel }) => {
    const tieneHijos = permisosManager.permisos.hijos.has(nodo.opctag)
    const estaExpandido = permisosManager.expandidos.has(nodo.opctag)
    const tieneAcciones = nodo.esHoja
    const panelAccionesAbierto = panelesAccionesAbiertos.some((p) => p.opctag === nodo.opctag)
    const estadoCheckbox = permisosManager.obtenerEstadoOpcion(nodo.opctag)
    const tieneCambios = tieneCambiosPendientes(nodo.opctag)

    const acciones = accionesCache.get(nodo.opctag) || []
    const estaCargandoAcciones = loadingAcciones.has(nodo.opctag)
    const tieneErrorAcciones = erroresAcciones.has(nodo.opctag)

    return (
      <Box>
        <Box
          sx={{
            pl: nivel * 3,
            py: 1,
            display: "flex",
            alignItems: "center",
            bgcolor: nivel === 0 ? "grey.50" : "transparent",
            borderBottom: nivel === 0 ? "1px solid" : "none",
            borderColor: "divider",
            borderRadius: nivel === 0 ? 1 : 0,
            mx: nivel === 0 ? 1 : 0,
            mt: nivel === 0 ? 1 : 0,
            position: "relative",
          }}
        >
          {tieneCambios && (
            <Box
              sx={{
                position: "absolute",
                left: 4,
                top: "50%",
                transform: "translateY(-50%)",
                width: 4,
                height: 4,
                borderRadius: "50%",
                bgcolor: "warning.main",
              }}
            />
          )}

          <Checkbox
            checked={estadoCheckbox === true}
            indeterminate={estadoCheckbox === "indeterminate"}
            onChange={(e) => permisosManager.toggleOpcion(nodo.opctag, e.target.checked)}
            size={nivel === 0 ? "medium" : "small"}
            color="primary"
            sx={{ ml: tieneCambios ? 2 : 0 }}
          />

          <Box sx={{ ml: 1, flex: 1 }}>
            <Typography variant={nivel === 0 ? "subtitle1" : "body2"} fontWeight={nivel === 0 ? "bold" : "normal"}>
              {nodo.opccaption}
              {tieneCambios && (
                <Chip label="Cambios" size="small" color="warning" sx={{ ml: 1, height: 20, fontSize: "0.7rem" }} />
              )}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {nodo.opctag} | Nivel {nivel}
              {/* {tieneAcciones ? "Hoja" : "Padre"} */}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center">
            {tieneHijos ? (
              <IconButton
                size="small"
                onClick={() => permisosManager.toggleExpandir(nodo.opctag)}
                sx={{ mr: tieneAcciones ? 1 : 0 }}
              >
                {estaExpandido ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            ) : null}

            {tieneAcciones && (
              <IconButton
                size="small"
                onClick={() => handleAbrirAcciones(nodo.opctag, nodo)}
                color={panelAccionesAbierto ? "primary" : "default"}
                disabled={estaCargandoAcciones}
              >
                {estaCargandoAcciones ? (
                  <CircularProgress size={20} />
                ) : tieneErrorAcciones ? (
                  <Chip label="!" size="small" color="error" sx={{ minWidth: 24, height: 24 }} />
                ) : acciones.length > 0 ? (
                  <Box sx={{ position: "relative" }}>
                    <Chip label={acciones.length} size="small" sx={{ minWidth: 24, height: 24 }} />
                    {tieneCambios && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -2,
                          right: -2,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "warning.main",
                          border: "1px solid white",
                        }}
                      />
                    )}
                  </Box>
                ) : (
                  <Security fontSize="small" />
                )}
              </IconButton>
            )}
          </Box>
        </Box>

        {tieneHijos && estaExpandido && (
          <Box>
            {permisosManager.permisos.hijos.get(nodo.opctag).map((hijo) => {
              const hijoNodo = permisosManager.permisos.opciones.get(hijo)
              return hijoNodo ? <NodoPermiso key={hijo} nodo={hijoNodo} nivel={nivel + 1} /> : null
            })}
          </Box>
        )}
      </Box>
    )
  })

  const PanelAcciones = React.memo(({ panelData, index }) => {
    const { opctag, opcionInfo } = panelData
    const [expanded, setExpanded] = useState(true)

    const acciones = accionesCache.get(opctag) || []
    const cargando = loadingAcciones.has(opctag)
    const tieneError = erroresAcciones.has(opctag)
    const errorInfo = erroresAcciones.get(opctag)
    const tieneCambios = tieneCambiosPendientes(opctag)
    const cambios = cambiosPendientesAcciones.get(opctag) || new Map()

    const accionesPermitidas = acciones.filter((a) => accionEstaPermitida(opctag, a.acccaption)).length

    const handleCerrarPanel = useCallback(() => {
      if (tieneCambios) {
        setDialogoCerrarPanel({
          opctag,
          opcionInfo: {
            opccaption: opcionInfo.opccaption,
            nivel: opcionInfo.nivel,
          },
        })
      } else {
        setPanelesAccionesAbiertos((prev) => prev.filter((p) => p.opctag !== opctag))
      }
    }, [opctag, opcionInfo, tieneCambios])

    const handleAplicarCambios = useCallback(() => {
      aplicarCambiosPendientes(opctag)
    }, [aplicarCambiosPendientes, opctag])

    const handleDescartarCambios = useCallback(() => {
      descartarCambiosPendientes(opctag)
    }, [descartarCambiosPendientes, opctag])

    const handleMoverArriba = useCallback(() => {
      setPanelesAccionesAbiertos((prev) => {
        const panel = prev.find((p) => p.opctag === opctag)
        const otros = prev.filter((p) => p.opctag !== opctag)
        return [panel, ...otros]
      })
    }, [opctag])

    if (tieneError) {
      return (
        <Paper sx={{ mt: 2, mb: 2 }}>
          <Box
            sx={{
              p: 2,
              bgcolor: "error.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold" color="error.contrastText">
              Error cargando acciones
            </Typography>
            <IconButton size="small" onClick={handleCerrarPanel}>
              <Close />
            </IconButton>
          </Box>
          <Box p={2}>
            <Alert
              severity="error"
              action={
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => reintentarCargaAcciones(opctag)}
                  disabled={cargando}
                >
                  {cargando ? <CircularProgress size={16} /> : "Reintentar"}
                </Button>
              }
            >
              {errorInfo?.mensaje || "Error al cargar acciones"}
            </Alert>
          </Box>
        </Paper>
      )
    }

    if (cargando) {
      return (
        <Paper sx={{ p: 2, mt: 2, mb: 2 }}>
          <Box display="flex" justifyContent="center" alignItems="center" py={2}>
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando acciones...
            </Typography>
          </Box>
        </Paper>
      )
    }

    if (acciones.length === 0) {
      return (
        <Paper sx={{ mt: 2, mb: 2 }}>
          <Box
            sx={{ p: 2, bgcolor: "grey.100", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <Box display="flex" alignItems="center">
              <Security fontSize="small" sx={{ mr: 1, color: "grey.600" }} />
              <Typography variant="subtitle2" fontWeight="bold">
                Sin acciones configuradas: {opcionInfo.opccaption} {opctag}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => reintentarCargaAcciones(opctag)}
                disabled={cargando}
              >
                Revalidar
              </Button>
              <IconButton size="small" onClick={handleCerrarPanel}>
                <Close />
              </IconButton>
            </Box>
          </Box>
          <Box p={2}>
            <Alert severity="info">No hay acciones disponibles para esta opción</Alert>
          </Box>
        </Paper>
      )
    }

    return (
      <Paper
        sx={{
          mt: 2,
          mb: 2,
          overflow: "hidden",
          borderLeft: index === 0 ? "4px solid" : "none",
          borderColor: tieneCambios ? "warning.main" : "primary.main",
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: tieneCambios ? "warning.light" : "primary.light",
            color: tieneCambios ? "warning.contrastText" : "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center">
            <Security fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              {opcionInfo?.opccaption || opctag}
            </Typography>
            <Chip
              label={`${accionesPermitidas}/${acciones.length}`}
              size="small"
              sx={{ ml: 2, bgcolor: "white", color: tieneCambios ? "warning.main" : "primary.main" }}
            />
            {tieneCambios && (
              <Chip label={`${cambios.size} cambio(s)`} size="small" color="warning" sx={{ ml: 1, bgcolor: "white" }} />
            )}
            {index > 0 && (
              <IconButton
                size="small"
                sx={{ ml: 1, color: "inherit" }}
                onClick={handleMoverArriba}
                title="Mover arriba"
              >
                <ArrowUpward fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Box display="flex" alignItems="center">
            {tieneCambios && (
              <Button
                size="small"
                variant="contained"
                color="warning"
                onClick={handleAplicarCambios}
                sx={{ mr: 1, color: "white" }}
              >
                Aplicar
              </Button>
            )}
            <IconButton size="small" sx={{ color: "inherit" }} onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            <IconButton size="small" sx={{ color: "inherit", ml: 1 }} onClick={handleCerrarPanel}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box p={2}>
            {tieneCambios && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">Tienes cambios pendientes. Cerrar el panel los descartará.</Typography>
                  <Button size="small" color="inherit" onClick={handleDescartarCambios}>
                    Descartar cambios
                  </Button>
                </Box>
              </Alert>
            )}

            <Box display="flex" gap={1} mb={2}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CheckBox />}
                onClick={() => toggleTodasAcciones(opctag, true)}
                sx={{ flex: 1 }}
              >
                Permitir todas
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CheckBoxOutlineBlank />}
                onClick={() => toggleTodasAcciones(opctag, false)}
                sx={{ flex: 1 }}
              >
                Denegar todas
              </Button>
            </Box>

            <Grid container spacing={1}>
              {acciones.map((accion, idx) => {
                const estaPermitida = accionEstaPermitida(opctag, accion.acccaption)
                const tieneCambio = cambios.has(accion.acccaption)

                return (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={estaPermitida}
                          onChange={(e) => toggleAccion(opctag, accion.acccaption, e.target.checked)}
                          size="small"
                          color={tieneCambio ? "warning" : "primary"}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">
                            {accion.acccaption}
                            {tieneCambio && (
                              <Chip
                                label="*"
                                size="small"
                                color="warning"
                                sx={{ ml: 1, height: 16, width: 16, fontSize: "0.6rem" }}
                              />
                            )}
                          </Typography>
                          {/* {accion.accnameicono && (
                            <Typography variant="caption" color="textSecondary">
                              {accion.accnameicono}
                            </Typography>
                          )} */}
                        </Box>
                      }
                      sx={{
                        width: "100%",
                        m: 0,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: tieneCambio ? "warning.50" : "transparent",
                        border: tieneCambio ? "1px solid" : "none",
                        borderColor: "warning.200",
                      }}
                    />
                  </Grid>
                )
              })}
            </Grid>
          </Box>
        </Collapse>
      </Paper>
    )
  })

  const DialogoCerrarPanel = () => {
    if (!dialogoCerrarPanel) return null

    const { opctag, opcionInfo } = dialogoCerrarPanel
    const cambios = cambiosPendientesAcciones.get(opctag) || new Map()
    const accionesConCambios = Array.from(cambios.entries())

    return (
      <Dialog open={true} onClose={handleCancelarCerrarPanel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Warning color="warning" sx={{ mr: 1 }} />
            Cambios pendientes
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Has realizado cambios en las acciones de <strong>{opcionInfo.opccaption}</strong>.
          </Typography>

          <Alert severity="warning" sx={{ my: 2 }}>
            ¿Qué deseas hacer con los cambios antes de cerrar el panel?
          </Alert>

          {accionesConCambios.length > 0 && (
            <Box sx={{ mt: 2, maxHeight: 200, overflow: "auto" }}>
              <Typography variant="subtitle2" gutterBottom>
                Cambios realizados:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {accionesConCambios.map(([acccaption, permitir], idx) => (
                  <li key={idx}>
                    <Typography variant="body2">
                      <strong>{acccaption}</strong>: {permitir ? "Permitir" : "Denegar"}
                    </Typography>
                  </li>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelarCerrarPanel}>Cancelar</Button>
          <Button onClick={() => handleConfirmarCerrarPanel(opctag, false)} color="inherit">
            Descartar cambios
          </Button>
          <Button onClick={() => handleConfirmarCerrarPanel(opctag, true)} color="primary" variant="contained">
            Aplicar y cerrar
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  const renderArbol = () => {
    const hijosRoot = permisosManager.permisos.hijos.get("root") || []

    if (hijosRoot.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          No hay opciones de menú disponibles
        </Alert>
      )
    }

    return (
      <Paper sx={{ p: 2, maxHeight: 500, overflow: "auto" }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Permisos de Menú
        </Typography>
        {hijosRoot.map((hijo) => {
          const nodo = permisosManager.permisos.opciones.get(hijo)
          return nodo ? <NodoPermiso key={hijo} nodo={nodo} nivel={0} /> : null
        })}
      </Paper>
    )
  }

  // ==============================================
  // 9. RENDER PRINCIPAL
  // ==============================================
  if (isLoadingPermisos) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando permisos...</Typography>
      </Box>
    )
  }

  if (errorPermisos) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error cargando permisos: {errorPermisos.message}
        </Alert>
        <Box display="flex" gap={2}>
          <Button onClick={() => refetchPermisos()} variant="outlined">
            Reintentar
          </Button>
          <Button onClick={() => navigate(-1)} variant="text">
            Volver
          </Button>
        </Box>
      </Box>
    )
  }

  if (!ciacodigo || !usrcodigo || !modcodigo) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Faltan parámetros necesarios
      </Alert>
    )
  }

  return (
    <>
      <Card sx={{ maxWidth: 1400, margin: "auto", minHeight: 600 }}>
        <CardHeader
          title={
            <Typography variant="h5" component="h1">
              Gestión de Permisos - {usuario?.usrcodigo || "Usuario"}
            </Typography>
          }
          subheader={
            <Box mt={1}>
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                <Chip
                  icon={<CheckBox />}
                  label={`Opciones: ${permisosManager.estadisticas.permitidos}/${permisosManager.estadisticas.total}`}
                  variant="outlined"
                />
                {!accionesCargadas && (
                  <Chip
                    icon={<CircularProgress size={16} />}
                    label="Cargando acciones..."
                    color="info"
                    variant="outlined"
                  />
                )}
                {Array.from(cambiosPendientesAcciones.keys()).length > 0 && (
                  <Chip
                    icon={<Warning />}
                    label={`${Array.from(cambiosPendientesAcciones.keys()).length} panel(es) con cambios`}
                    color="warning"
                    variant="outlined"
                  />
                )}
                {esPerfil && (
                  <Alert severity="warning" sx={{ py: 0.5 }}>
                    ⚠️ Al guardar, se actualizarán todos los usuarios con este perfil
                  </Alert>
                )}
              </Box>
            </Box>
          }
          action={
            <Box display="flex" gap={1}>
              <Button variant="outlined" onClick={permisosManager.denegarTodo} startIcon={<CheckBoxOutlineBlank />}>
                Denegar Todo
              </Button>
              <Button variant="outlined" onClick={permisosManager.permitirTodo} startIcon={<CheckBox />}>
                Permitir Todo
              </Button>
              <Button
                variant="contained"
                onClick={handleGuardar}
                disabled={isSaving || !accionesCargadas}
                startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
              >
                {isSaving ? "Guardando..." : "Guardar Todo"}
              </Button>
            </Box>
          }
        />

        <CardContent>
          {renderArbol()}

          {panelesAccionesAbiertos.map((panelData, index) => (
            <PanelAcciones key={`${panelData.opctag}_${panelData.timestamp}`} panelData={panelData} index={index} />
          ))}
        </CardContent>
      </Card>

      <DialogoCerrarPanel />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default PermisosUsuario

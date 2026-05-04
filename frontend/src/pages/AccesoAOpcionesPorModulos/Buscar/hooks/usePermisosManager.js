// hooks/usePermisosManager.js - VERSIÓN CORREGIDA
import { useState, useCallback, useMemo, useEffect } from "react"

export const usePermisosManager = (initialData = null) => {
  const [permisos, setPermisos] = useState({
    opciones: new Map(),
    permisosMap: new Map(),
    hijos: new Map(),
    relaciones: {},
    raiz: "root",
  })

  const [expandidos, setExpandidos] = useState(new Set())
  const [expandidosAcciones, setExpandidosAcciones] = useState(new Set())

  // DEBUG: Ver qué llega
  useEffect(() => {
    console.log("🔄 usePermisosManager recibió:", initialData)
  }, [initialData])

  // Inicializar con datos - VERSIÓN MÁS ROBUSTA
  useEffect(() => {
    if (initialData && initialData.opciones && Array.isArray(initialData.opciones)) {
      console.log("📦 Inicializando manager con:", {
        opcionesCount: initialData.opciones.length,
        tieneRelaciones: !!initialData.relaciones,
        raiz: initialData.raiz,
      })

      const opcionesMap = new Map()
      const permisosMap = new Map()
      const hijosMap = new Map()

      // 1. Mapear opciones
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

      // 2. Mapear relaciones
      if (initialData.relaciones && typeof initialData.relaciones === "object") {
        Object.entries(initialData.relaciones).forEach(([padre, hijos]) => {
          if (Array.isArray(hijos)) {
            hijosMap.set(padre, hijos)
          }
        })
      } else {
        // Si no vienen relaciones, calcularlas
        console.log("⚠️ Calculando relaciones automáticamente")
        const relacionesCalculadas = {}

        initialData.opciones.forEach((opcion) => {
          const partes = opcion.opctag.split(".")

          if (partes.length === 1) {
            // Nivel 0 - hijo de root
            const rootHijos = hijosMap.get("root") || []
            hijosMap.set("root", [...rootHijos, opcion.opctag])
          } else {
            // Encontrar padre
            const padre = partes.slice(0, -1).join(".")
            const padreHijos = hijosMap.get(padre) || []
            hijosMap.set(padre, [...padreHijos, opcion.opctag])
          }
        })
      }

      // Asegurar que root exista
      if (!hijosMap.has("root")) {
        hijosMap.set("root", [])
      }

      // Agregar opciones de nivel 0 a root si no están
      const opcionesNivel0 = Array.from(opcionesMap.values())
        .filter((op) => op.nivel === 0)
        .map((op) => op.opctag)

      const rootHijosActuales = hijosMap.get("root") || []
      const nuevosRootHijos = [...new Set([...rootHijosActuales, ...opcionesNivel0])]
      hijosMap.set("root", nuevosRootHijos.sort())

      const newState = {
        opciones: opcionesMap,
        permisosMap,
        hijos: hijosMap,
        relaciones: initialData.relaciones || {},
        raiz: initialData.raiz || "root",
      }

      console.log("✅ Manager inicializado:", {
        opciones: opcionesMap.size,
        permisos: permisosMap.size,
        hijos: hijosMap.size,
        rootHijos: hijosMap.get("root")?.length,
      })

      setPermisos(newState)
    } else {
      console.warn("⚠️ Manager NO inicializado - Datos:", initialData)
    }
  }, [initialData])

  // Toggle opción con hijos
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

  // Toggle opción simple
  const toggleOpcionSimple = useCallback((opctag, nuevoEstado) => {
    setPermisos((prev) => ({
      ...prev,
      permisosMap: new Map(prev.permisosMap).set(opctag, nuevoEstado),
    }))
  }, [])

  // Obtener estado de checkbox
  const obtenerEstadoOpcion = useCallback(
    (opctag) => {
      try {
        const hijos = permisos.hijos.get(opctag) || []

        if (hijos.length === 0) {
          const permiso = permisos.permisosMap.get(opctag)
          return permiso === true
        }

        let todosPermitidos = true
        let algunPermitido = false

        for (const hijo of hijos) {
          const permisoHijo = permisos.permisosMap.get(hijo)
          if (permisoHijo !== true) todosPermitidos = false
          if (permisoHijo === true) algunPermitido = true
        }

        if (todosPermitidos) return true
        if (algunPermitido) return "indeterminate"
        return false
      } catch (error) {
        console.error("Error en obtenerEstadoOpcion para", opctag, error)
        return false
      }
    },
    [permisos],
  )

  // Expandir/colapsar
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

  const toggleAccionesExpandir = useCallback((opctag) => {
    setExpandidosAcciones((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(opctag)) {
        nuevo.delete(opctag)
      } else {
        nuevo.add(opctag)
      }
      return nuevo
    })
  }, [])

  // Acciones masivas
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

  // Preparar datos para guardar
  const prepararDatosParaGuardar = useCallback(() => {
    const opcionesParaGuardar = []

    permisos.opciones.forEach((opcion, opctag) => {
      const permiso = permisos.permisosMap.get(opctag) || false
      opcionesParaGuardar.push({
        opctag,
        permiso,
        opccaption: opcion.opccaption,
      })
    })

    return opcionesParaGuardar
  }, [permisos])

  // Estadísticas
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
      porcentaje: total > 0 ? Math.round((permitidos / total) * 100) : 0,
    }
  }, [permisos.permisosMap])

  return {
    permisos,
    expandidos,
    expandidosAcciones,
    toggleOpcion,
    toggleOpcionSimple,
    obtenerEstadoOpcion,
    toggleExpandir,
    toggleAccionesExpandir,
    permitirTodo,
    denegarTodo,
    prepararDatosParaGuardar,
    estadisticas,
  }
}

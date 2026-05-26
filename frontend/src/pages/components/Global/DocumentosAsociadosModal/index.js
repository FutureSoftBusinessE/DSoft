import React, { useState, useEffect } from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab, Box } from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Swal from "sweetalert2"
import { api } from "../../../../api"
import fetchwrapper from "../../../../services/interceptors/fetchwrapper"
import TabArchivosFisicos from "./TabArchivosFisicos"
import TabCredenciales from "./TabCredenciales"
import TabImportarDocumento from "./TabImportarDocumento"

const mostrarAlerta = (titulo, mensaje, icono) => {
  Swal.fire({
    title: titulo,
    text: mensaje,
    icon: icono,
    didOpen: () => {
      const container = document.querySelector(".swal2-container")
      if (container) container.style.zIndex = "9999"
    },
  })
}

function useCatalogosDocumentos() {
  const tiposDoc = useQuery({
    queryKey: ["getAllTiposDocumentos"],
    queryFn: async () => {
      const res = await fetchwrapper("/DocumentosAsociadosComponent/getAllTiposDocumentos")
      const d = await res.json()
      return d.data || []
    },
    refetchOnWindowFocus: false,
  })
  const instituciones = useQuery({
    queryKey: ["getAllInstituciones"],
    queryFn: async () => {
      const res = await fetchwrapper("/DocumentosAsociadosComponent/getAllInstituciones")
      const d = await res.json()
      return d.data || []
    },
    refetchOnWindowFocus: false,
  })
  const tiposClaves = useQuery({
    queryKey: ["getAllTiposClaves"],
    queryFn: async () => {
      const res = await fetchwrapper("/DocumentosAsociadosComponent/getAllTiposClaves")
      const d = await res.json()
      return d.data || []
    },
    refetchOnWindowFocus: false,
  })
  return { tiposDoc, instituciones, tiposClaves }
}

const DocumentosAsociadosModal = ({ isOpen, onClose, contexto, onSuccess }) => {
  const [tabValue, setTabValue] = useState(0)
  const { tiposDoc, instituciones, tiposClaves } = useCatalogosDocumentos()
  const queryClient = useQueryClient()

  const [archivos, setArchivos] = useState([])
  const [docindex1, setDocindex1] = useState("")
  const [docindex2, setDocindex2] = useState("")
  const [docindex3, setDocindex3] = useState("")
  const [docindex4, setDocindex4] = useState("")
  const [docindex5, setDocindex5] = useState("")
  const [docindex6, setDocindex6] = useState("")
  const [docfecemi, setDocfecemi] = useState(null)
  const [docfecven, setDocfecven] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordP12, setPasswordP12] = useState("")
  const [isP12, setIsP12] = useState(false)
  const [fechasFirma, setFechasFirma] = useState({ emision: null, vencimiento: null })
  const [selectedDocUuid, setSelectedDocUuid] = useState("")

  const [formCredencial, setFormCredencial] = useState({
    insticodigo: "",
    clacodigo: "",
    url: "",
    usuario: "",
    clave: "",
    email: "",
    q1: "",
    r1: "",
    q2: "",
    r2: "",
    q3: "",
    r3: "",
    q4: "",
    r4: "",
  })

  const [guardandoIndice, setGuardandoIndice] = useState(0)

  // --- CORRECCIÓN: LIMPIEZA TOTAL DE ESTADOS AL ABRIR EL MODAL ---
  useEffect(() => {
    if (isOpen) {
      setTabValue(0)
      setArchivos([])
      setDocindex1("")
      setDocindex2("")
      setDocindex3("")
      setDocindex4("")
      setDocindex5("")
      setDocindex6("")
      setDocfecemi(null)
      setDocfecven(null)
      setShowPassword(false)
      setPasswordP12("")
      setIsP12(false)
      setFechasFirma({ emision: null, vencimiento: null })
      setSelectedDocUuid("")
      setFormCredencial({
        insticodigo: "",
        clacodigo: "",
        url: "",
        usuario: "",
        clave: "",
        email: "",
        q1: "",
        r1: "",
        q2: "",
        r2: "",
        q3: "",
        r3: "",
        q4: "",
        r4: "",
      })
      setGuardandoIndice(0)
    }
  }, [isOpen])

  const { mutateAsync: guardarDocumentoAsync, isPending } = useMutation({
    mutationFn: async (formData) => {
      return await api.post("/DocumentosAsociadosComponent/guardarArchivoAdjunto", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    },
  })

  const handleChangeCredencial = (field, value) => {
    setFormCredencial((prev) => ({ ...prev, [field]: value }))
  }

  const handleGuardar = async () => {
    if (tabValue === 0 && archivos.length === 0)
      return mostrarAlerta("Atención", "Debe seleccionar un archivo o tomar una foto", "warning")
    if (tabValue === 2 && !selectedDocUuid)
      return mostrarAlerta("Atención", "Seleccione un archivo de la grilla para importarlo", "warning")

    const secuenciaBase = parseInt(contexto.docsecuen) || 1
    let ultimaRespuesta = null
    const codigoCliente = contexto.clicodigo || contexto.docqgenero || ""
    const tablaContexto = contexto.docprocqgenero || "cxcmcli"

    try {
      if (tabValue === 0) {
        for (let i = 0; i < archivos.length; i++) {
          setGuardandoIndice(i + 1)
          const file = archivos[i]
          const formData = new FormData()
          formData.append("docqgenero", codigoCliente)
          formData.append("docprocqgenero", tablaContexto)
          formData.append("docsecuen", secuenciaBase + i)
          formData.append("docindex1", docindex1)
          formData.append("docindex2", docindex2)
          formData.append("docindex3", docindex3)
          formData.append("docindex4", docindex4)
          formData.append("docindex5", docindex5)
          formData.append("docindex6", docindex6)
          formData.append("file", file)

          if (file.name.toLowerCase().endsWith(".p12") || file.name.toLowerCase().endsWith(".pfx")) {
            if (!fechasFirma.emision) throw new Error("Debe validar el P12 antes de guardar.")
            formData.append("password_p12", passwordP12)
            formData.append("docfecemi", fechasFirma.emision)
            formData.append("docfecven", fechasFirma.vencimiento)
          } else {
            if (docfecemi) formData.append("docfecemi", docfecemi.format("YYYY-MM-DD"))
            if (docfecven) formData.append("docfecven", docfecven.format("YYYY-MM-DD"))
          }
          const response = await guardarDocumentoAsync(formData)
          ultimaRespuesta = response.data
        }
      } else if (tabValue === 1) {
        if (
          !formCredencial.insticodigo ||
          !formCredencial.clacodigo ||
          !formCredencial.usuario ||
          !formCredencial.clave
        )
          return mostrarAlerta("Atención", "Campos obligatorios vacíos", "warning")
        const formData = new FormData()
        formData.append("docqgenero", codigoCliente)
        formData.append("docprocqgenero", tablaContexto)
        formData.append("docsecuen", secuenciaBase)
        Object.keys(formCredencial).forEach((k) => formData.append(k, formCredencial[k]))
        const response = await guardarDocumentoAsync(formData)
        ultimaRespuesta = response.data
      } else if (tabValue === 2) {
        const response = await api.post("/DocumentosAsociadosComponent/ejecutarImportacionDocumento", {
          documentouuidOrigen: selectedDocUuid,
          docqgenero: codigoCliente,
          docprocqgenero: tablaContexto,
          docsecuen: secuenciaBase,
        })
        ultimaRespuesta = response.data
      }

      mostrarAlerta("¡Éxito!", `Operación procesada con éxito`, "success")
      queryClient.invalidateQueries(["documentosAsociados", codigoCliente, tablaContexto])

      if (onSuccess) onSuccess(ultimaRespuesta || {})
      onClose()
    } catch (error) {
      mostrarAlerta("Error", error.message || "Ocurrió un error", "error")
    } finally {
      setGuardandoIndice(0)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: "#196C87", color: "white" }}>Gestión de Documentos</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Archivos / Fotos" />
          <Tab label="Credenciales" />
          <Tab label="Importar Documento" />
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {tabValue === 0 && (
            <TabArchivosFisicos
              archivos={archivos}
              setArchivos={setArchivos}
              docindex1={docindex1}
              setDocindex1={setDocindex1}
              docindex2={docindex2}
              setDocindex2={setDocindex2}
              docindex3={docindex3}
              setDocindex3={setDocindex3}
              docindex4={docindex4}
              setDocindex4={setDocindex4}
              docindex5={docindex5}
              setDocindex5={setDocindex5}
              docindex6={docindex6}
              setDocindex6={setDocindex6}
              docfecemi={docfecemi}
              setDocfecemi={setDocfecemi}
              docfecven={docfecven}
              setDocfecven={setDocfecven}
              passwordP12={passwordP12}
              setPasswordP12={setPasswordP12}
              isP12={isP12}
              setIsP12={setIsP12}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              tiposDoc={tiposDoc}
              onFirmaCargada={(fechas) => setFechasFirma(fechas)}
            />
          )}
          {tabValue === 1 && (
            <TabCredenciales
              formCredencial={formCredencial}
              handleChangeCredencial={handleChangeCredencial}
              instituciones={instituciones}
              tiposClaves={tiposClaves}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          )}
          {tabValue === 2 && (
            <TabImportarDocumento
              tiposDoc={tiposDoc}
              selectedDocUuid={selectedDocUuid}
              setSelectedDocUuid={setSelectedDocUuid}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleGuardar} variant="contained" color={tabValue === 2 ? "secondary" : "primary"}>
          {tabValue === 2 ? "Importar Puntero" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
export default DocumentosAsociadosModal

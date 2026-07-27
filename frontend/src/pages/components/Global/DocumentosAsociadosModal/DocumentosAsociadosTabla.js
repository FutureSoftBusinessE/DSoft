// import React from "react";
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material"
import DownloadIcon from "@mui/icons-material/Download"
import DeleteIcon from "@mui/icons-material/Delete"
import VpnKeyIcon from "@mui/icons-material/VpnKey"
import FilePresentIcon from "@mui/icons-material/FilePresent"
import VisibilityIcon from "@mui/icons-material/Visibility"
import CloseIcon from "@mui/icons-material/Close"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import fetchwrapper from "../../../../services/interceptors/fetchwrapper"
import { api } from "../../../../api"
import Swal from "sweetalert2"

// Helper para forzar alertas al frente[cite: 8]
const mostrarAlerta = (titulo, mensaje, icono) => {
  Swal.fire({
    title: titulo,
    html: mensaje,
    icon: icono,
    didOpen: () => {
      const container = document.querySelector(".swal2-container")
      if (container) container.style.zIndex = "9999"
    },
  })
}

const DocumentosAsociadosTabla = ({ qgenero, procqgenero, onDataLoaded }) => {
  const queryClient = useQueryClient()

  // --- ESTADOS PARA EL VISOR DE DOCUMENTOS ---[cite: 8]
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewFileType, setPreviewFileType] = useState("")
  const [previewFileName, setPreviewFileName] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)

  const { data: documentos = [] } = useQuery({
    queryKey: ["documentosAsociados", qgenero, procqgenero],
    queryFn: async () => {
      if (!qgenero) return []
      // El backend ahora devuelve los documentos filtrados por permisos y eventos
      const res = await fetchwrapper(`/DocumentosAsociadosComponent/getDocumentosAsociados/${qgenero}/${procqgenero}`)
      const json = await res.json()
      const lista = json.data || []

      if (onDataLoaded) onDataLoaded(lista.length + 1)
      return lista
    },
    enabled: !!qgenero,
  })

  const { mutate: eliminarDoc } = useMutation({
    mutationFn: async (uuid) => {
      return await api.delete(`/DocumentosAsociadosComponent/deleteDocumento/${uuid}`)
    },
    onSuccess: () => {
      mostrarAlerta("Eliminado", "El registro ha sido removido con éxito.", "success")
      queryClient.invalidateQueries(["documentosAsociados", qgenero, procqgenero])
    },
  })

  // --- HELPER CENTRALIZADO PARA OBTENER EL BLOB DEL DOCUMENTO ---[cite: 8]
  const obtenerBlobDocumento = async (uuid) => {
    let foundToken = ""
    const storages = [localStorage, sessionStorage]

    for (const storage of storages) {
      for (let i = 0; i < storage.length; i++) {
        const val = storage.getItem(storage.key(i))
        if (typeof val === "string" && val.includes(".") && val.split(".").length === 3 && val.includes("eyJ")) {
          foundToken = val
          break
        }
        try {
          const obj = JSON.parse(val)
          if (obj && typeof obj === "object") {
            for (const key in obj) {
              if (typeof obj[key] === "string" && obj[key].split(".").length === 3 && obj[key].includes("eyJ")) {
                foundToken = obj[key]
                break
              }
            }
          }
        } catch (e) {}
        if (foundToken) break
      }
      if (foundToken) break
    }

    if (!foundToken && api.defaults?.headers?.common?.Authorization) {
      foundToken = api.defaults.headers.common.Authorization.replace("Bearer ", "")
    }

    const response = await fetchwrapper(`/DocumentosAsociadosComponent/downloadDocumento/${uuid}`)

    if (!response.ok) {
      throw new Error("No se pudo descargar el archivo desde el servidor.")
    }

    return await response.blob()
  }

  // --- FUNCIÓN DE DESCARGA ---[cite: 8]
  const handleDescargar = async (uuid, nombre) => {
    try {
      const blob = await obtenerBlobDocumento(uuid)
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", nombre)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      mostrarAlerta("Error", "No se pudo descargar el archivo físico. Verifique la conexión.", "error")
    }
  }

  // --- NUEVA FUNCIÓN: VISOR DE DOCUMENTOS ---[cite: 8]
  const handlePrevisualizar = async (uuid, nombre, extension) => {
    const ext = extension.toLowerCase()
    const extensionesNativas = ["pdf", "txt", "jpg", "jpeg", "png", "gif", "webp"]

    if (!extensionesNativas.includes(ext)) {
      Swal.fire({
        title: "Formato no soportado",
        text: `El formato .${ext.toUpperCase()} (Office/Otros) no admite previsualización directa en la web. Se descargará el archivo en su lugar.`,
        icon: "info",
        confirmButtonColor: "#196C87",
        confirmButtonText: "Descargar Documento",
      }).then((result) => {
        if (result.isConfirmed) {
          handleDescargar(uuid, nombre)
        }
      })
      return
    }

    setPreviewFileName(nombre)
    setPreviewFileType(ext)
    setPreviewLoading(true)
    setPreviewOpen(true)

    try {
      const blob = await obtenerBlobDocumento(uuid)
      let mimeType = "application/pdf"
      if (["jpg", "jpeg"].includes(ext)) mimeType = "image/jpeg"
      else if (ext === "png") mimeType = "image/png"
      else if (ext === "gif") mimeType = "image/gif"
      else if (ext === "webp") mimeType = "image/webp"
      else if (ext === "txt") mimeType = "text/plain"

      const fileBlob = new Blob([blob], { type: mimeType })
      const url = window.URL.createObjectURL(fileBlob)
      setPreviewUrl(url)
    } catch (error) {
      setPreviewOpen(false)
      mostrarAlerta("Error", "No se pudo cargar la vista previa del documento.", "error")
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  // --- LÓGICA DE DATOS SENSIBLES ---
  const handleVerDatosSensibles = async (uuid) => {
    try {
      const res = await api.get(`/DocumentosAsociadosComponent/getDatosSensibles/${uuid}`)
      let datos = res.data.data

      if (datos && typeof datos.usuario === "string" && datos.usuario.trim().startsWith("{")) {
        let jsonStr = datos.usuario.trim()

        try {
          // 1. Limpieza exhaustiva de errores de tipeo comunes provenientes del backend
          jsonStr = jsonStr.replace(/#respuesta/g, '"respuesta')
          // Repara casos como "respuesta#: o "respuesta#":
          jsonStr = jsonStr.replace(/respuesta[#|!|$|%|&]*\s*:/g, 'respuesta":')
          jsonStr = jsonStr.replace(/pregunta[#|!|$|%|&]*\s*:/g, 'pregunta":')

          // eslint-disable-next-line no-control-regex
          jsonStr = jsonStr.replace(/\},\s*[^{\s[\]"']+\s*\{/g, "},{")
          // eslint-disable-next-line no-control-regex
          jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, "")

          datos = JSON.parse(jsonStr)
        } catch (e) {
          console.warn("JSON malformado. Usando motor de extracción por Regex avanzado.")

          const extraerValor = (clave) => {
            const regex = new RegExp(`"${clave}"\\s*:\\s*"([^"]*)"`)
            const match = jsonStr.match(regex)
            return match ? match[1] : ""
          }

          // 2. Rescate manual y seguro de las preguntas de seguridad
          const preguntasExtraidas = []
          const bloquePreguntas = jsonStr.match(/"preguntas"\s*:\s*\[(.*?)\]/)

          if (bloquePreguntas && bloquePreguntas[1]) {
            const innerStr = bloquePreguntas[1]
            // Extraemos las preguntas
            const matchPreguntas = [...innerStr.matchAll(/"pregunta"[^:]*:\s*"([^"]*)"/g)]
            // Extraemos las respuestas ignorando caracteres extraños antes de los dos puntos
            const matchRespuestas = [...innerStr.matchAll(/"respuesta[^:]*:\s*"([^"]*)"/g)]

            const maxLen = Math.max(matchPreguntas.length, matchRespuestas.length)
            for (let i = 0; i < maxLen; i++) {
              preguntasExtraidas.push({
                pregunta: matchPreguntas[i] ? matchPreguntas[i][1] : "",
                respuesta: matchRespuestas[i] ? matchRespuestas[i][1] : "",
              })
            }
          }

          datos = {
            usuario: extraerValor("usuario"),
            clave: extraerValor("clave"),
            url: extraerValor("url"),
            email: extraerValor("email"),
            preguntas: preguntasExtraidas, // Ahora inyectamos las preguntas rescatadas
          }
        }
      } else if (typeof datos === "string") {
        try {
          datos = JSON.parse(datos)
        } catch (e) {}
      }

      if (res.data.docextension === "p12" || res.data.docextension === "pfx") {
        mostrarAlerta(
          "Contraseña Certificado",
          `<b>Clave:</b> ${datos.clave_certificado || datos.clave_certified || "No registrada"}`,
          "info",
        )
      } else {
        let preguntasHtml = ""
        if (datos.preguntas && Array.isArray(datos.preguntas)) {
          const preguntasValidas = datos.preguntas.filter((p) => p.pregunta || p.respuesta)

          if (preguntasValidas.length > 0) {
            preguntasHtml = `
              <hr style="margin: 12px 0; border: 0; border-top: 1px solid #ddd;" />
              <p style="margin-bottom: 5px; color: #196C87;"><b>Preguntas de Seguridad:</b></p>
              <ul style="margin-top: 0; padding-left: 20px; font-size: 0.85rem; list-style-type: square;">
            `
            preguntasValidas.forEach((p) => {
              preguntasHtml += `
                <li style="margin-bottom: 6px;">
                  <b>P:</b> ${p.pregunta || "—"}<br/>
                  <b>R:</b> ${p.respuesta || "—"}
                </li>
              `
            })
            preguntasHtml += `</ul>`
          }
        }

        mostrarAlerta(
          "Credencial Virtual",
          `
          <div style="text-align:left; font-size: 0.95rem;">
            <p style="margin-bottom: 6px;"><b>Usuario:</b> ${datos.usuario || "—"}</p>
            <p style="margin-bottom: 6px;"><b>Clave:</b> ${datos.clave || "—"}</p>
            <p style="margin-bottom: 6px;"><b>Sitio Web:</b> ${datos.url ? `<a href="${datos.url}" target="_blank" style="color: #196C87; text-decoration: none;">${datos.url}</a>` : "—"}</p>
            <p style="margin-bottom: 6px;"><b>Email:</b> ${datos.email || "—"}</p>
            ${preguntasHtml}
          </div>
        `,
          "info",
        )
      }
    } catch (error) {
      console.error(error)
      mostrarAlerta("Error", "No se pudieron recuperar las claves.", "error")
    }
  }

  if (!qgenero) return null

  return (
    <>
      <Card sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilePresentIcon color="primary" />
            <Typography variant="h6" sx={{ color: "#196C87", fontWeight: "bold" }}>
              Documentación y Credenciales Asociadas
            </Typography>
          </Box>

          {documentos.length === 0 ? (
            <Typography variant="body2" color="textSecondary" align="center" my={2}>
              No existen registros asociados o no cuenta con los permisos para visualizarlos.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
                  <TableRow>
                    <TableCell>
                      <b>Nombre de Documento</b>
                    </TableCell>
                    <TableCell>
                      <b>Ext.</b>
                    </TableCell>
                    <TableCell>
                      <b>Institución</b>
                    </TableCell>
                    <TableCell>
                      <b>Observación</b>
                    </TableCell>
                    <TableCell>
                      <b>Fecha Registro</b>
                    </TableCell>
                    <TableCell align="center">
                      <b>Acciones</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documentos.map((doc) => (
                    <TableRow key={doc.documentouuid} hover>
                      <TableCell>{doc.docnombre}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "0.8rem" }}
                        >
                          {doc.docextension}
                        </Typography>
                      </TableCell>
                      <TableCell>{doc.instidescri || "—"}</TableCell>
                      <TableCell>{doc.docindex1 || "—"}</TableCell>
                      <TableCell>{doc.docfechorisys}</TableCell>
                      <TableCell align="center">
                        {/* NUEVO BOTÓN: Previsualizar (solo si no es credencial) */}
                        {doc.docextension !== "clv" && doc.docextension !== "p12" && doc.docextension !== "pfx" && (
                          <Tooltip title="Previsualizar">
                            <IconButton
                              size="small"
                              sx={{ color: "#4caf50" }}
                              onClick={() => handlePrevisualizar(doc.documentouuid, doc.docnombre, doc.docextension)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Botón original de Descargar */}
                        {doc.docextension !== "clv" && (
                          <Tooltip title="Descargar Archivo">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleDescargar(doc.documentouuid, doc.docnombre)}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Botón de Credenciales Seguras */}
                        {(doc.docextension === "clv" || doc.docextension === "p12" || doc.docextension === "pfx") && (
                          <Tooltip title="Ver Claves">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleVerDatosSensibles(doc.documentouuid)}
                            >
                              <VpnKeyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Botón Eliminar */}
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              Swal.fire({
                                title: "¿Eliminar registro?",
                                text: "Esta acción no se puede deshacer.",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#d33",
                                confirmButtonText: "Sí, eliminar",
                                target: document.body,
                                didOpen: () => {
                                  const container = document.querySelector(".swal2-container")
                                  if (container) {
                                    container.style.zIndex = "99999"
                                  }
                                },
                              }).then((r) => {
                                if (r.isConfirmed) eliminarDoc(doc.documentouuid)
                              })
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* --- MODAL DEL VISOR DE DOCUMENTOS GENÉRICO --- */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: "85vh", maxHeight: "85vh" } }}
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8f9fa" }}
        >
          <Typography variant="h6" sx={{ color: "#196C87", fontWeight: "bold" }}>
            Vista Previa: {previewFileName}
          </Typography>
          <IconButton onClick={handleClosePreview} size="small" color="error">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ p: 0, display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "#e0e0e0" }}
        >
          {previewLoading ? (
            <Box display="flex" flexDirection="column" alignItems="center">
              <CircularProgress size={50} thickness={4} sx={{ color: "#196C87", mb: 2 }} />
              <Typography color="textSecondary">Cargando documento...</Typography>
            </Box>
          ) : previewUrl ? (
            ["jpg", "jpeg", "png", "gif", "webp"].includes(previewFileType) ? (
              // Visor de Imágenes
              <img
                src={previewUrl}
                alt="Vista Previa"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            ) : (
              // Visor de PDF y TXT
              <iframe
                src={previewUrl}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="Vista Previa Documento"
              />
            )
          ) : (
            <Typography color="error">No se pudo cargar el documento.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} color="primary" variant="outlined">
            Cerrar Vista Previa
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DocumentosAsociadosTabla

// import React from "react";
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
} from "@mui/material"
import DownloadIcon from "@mui/icons-material/Download"
import DeleteIcon from "@mui/icons-material/Delete"
import VpnKeyIcon from "@mui/icons-material/VpnKey"
import FilePresentIcon from "@mui/icons-material/FilePresent"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import fetchwrapper from "../../../../services/interceptors/fetchwrapper"
import { api } from "../../../../api"
import Swal from "sweetalert2"

// Helper para forzar alertas al frente
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

  const { data: documentos = [] } = useQuery({
    queryKey: ["documentosAsociados", qgenero, procqgenero],
    queryFn: async () => {
      if (!qgenero) return []
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

  const handleDescargar = async (uuid, nombre) => {
    try {
      // --- CÓDIGO CLONADO DE FIRMARPDFDF PARA EVITAR EL [object Object] DE AXIOS ---
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

      const authHeader = `Bearer ${foundToken.replace(/"/g, "")}`
      const baseUrl = api.defaults && api.defaults.baseURL ? api.defaults.baseURL : "http://127.0.0.1:5000"

      // Uso de FETCH nativo para proteger el Blob binario
      const response = await fetch(`${baseUrl}/DocumentosAsociadosComponent/downloadDocumento/${uuid}`, {
        method: "GET",
        headers: { Authorization: authHeader },
      })

      if (!response.ok) {
        throw new Error("No se pudo descargar el archivo desde el servidor.")
      }

      const blob = await response.blob()
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

  const handleVerDatosSensibles = async (uuid) => {
    try {
      const res = await api.get(`/DocumentosAsociadosComponent/getDatosSensibles/${uuid}`)
      let datos = res.data.data

      // --- SISTEMA BLINDADO DE EXTRACCIÓN DE DATOS ---
      if (datos && typeof datos.usuario === "string" && datos.usuario.trim().startsWith("{")) {
        let jsonStr = datos.usuario.trim()
        try {
          jsonStr = jsonStr.replace(/#respuesta/g, '"respuesta')
          // eslint-disable-next-line no-control-regex
          jsonStr = jsonStr.replace(/\},\s*[^{\s[\]"']+\s*\{/g, "},{")
          // eslint-disable-next-line no-control-regex
          jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, "")

          datos = JSON.parse(jsonStr)
        } catch (e) {
          console.warn("Usando motor de extracción por Regex.")
          const extraerValor = (clave) => {
            const regex = new RegExp(`"${clave}"\\s*:\\s*"([^"]*)"`)
            const match = jsonStr.match(regex)
            return match ? match[1] : ""
          }

          datos = {
            usuario: extraerValor("usuario"),
            clave: extraerValor("clave"),
            url: extraerValor("url"),
            email: extraerValor("email"),
            // Default vacío si está destruido
            preguntas: [],
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
          `<b>Clave:</b> ${datos.clave_certificado || datos.clave_certified}`,
          "info",
        )
      } else {
        // --- CONSTRUCCIÓN DEL HTML DE PREGUNTAS ---
        let preguntasHtml = ""
        if (datos.preguntas && Array.isArray(datos.preguntas)) {
          // Filtramos para mostrar solo las preguntas/respuestas que no estén vacías
          const preguntasValidas = datos.preguntas.filter((p) => p.pregunta || p.respuesta)

          if (preguntasValidas.length > 0) {
            preguntasHtml = `
              <hr style="margin: 12px 0; border: 0; border-top: 1px solid #ddd;" />
              <p style="margin-bottom: 5px; color: #196C87;"><b>Preguntas de Seguridad:</b></p>
              <ul style="margin-top: 0; padding-left: 20px; font-size: 0.85rem; list-style-type: square;">
            `
            preguntasValidas.forEach((p, index) => {
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

        // --- RENDERIZADO FINAL ---
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
      mostrarAlerta("Error", "No se pudieron recuperar las claves.", "error")
    }
  }

  if (!qgenero) return null

  return (
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
            No existen registros asociados.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
                <TableRow>
                  <TableCell>
                    <b>Nombre</b>
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
  )
}

export default DocumentosAsociadosTabla

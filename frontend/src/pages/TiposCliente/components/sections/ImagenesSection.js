import { useMemo, useState } from "react"
import { Box, Grid, Typography } from "@mui/material"
import { showWarning } from "../../../../api"
import CustomPhotoCam from "../../../../components/CustomPhotoCam"

const isLikelyBase64 = (value) => /^[A-Za-z0-9+/=]+$/.test(value)

const buildImageSrc = (value) => {
  const raw = String(value || "").trim()
  if (!raw) return null
  if (raw.startsWith("data:image/")) return raw
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw
  if (isLikelyBase64(raw)) return `data:image/jpeg;base64,${raw}`
  return null
}

const ImagenesSection = ({ data, change, readOnly, Field, Section, selectOptions = {} }) => {
  const persistedImageSrc = useMemo(() => buildImageSrc(data.apocodigo), [data.apocodigo])
  const [localPreview, setLocalPreview] = useState(null)

  const currentPreview = persistedImageSrc || localPreview

  return (
    <Section title="Imágenes">
      <Grid item xs={12} sm={6}>
        <Field
          label="Código/Referencia Imagen"
          name="apocodigo"
          value={data.apocodigo}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        {currentPreview ? (
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Vista previa
            </Typography>
            <Box
              component="img"
              src={currentPreview}
              alt="Imagen tipo cliente"
              sx={{ maxWidth: "100%", maxHeight: 180, border: "1px solid #ddd", borderRadius: 1 }}
            />
          </Box>
        ) : (
          <Typography variant="body2" sx={{ p: 1 }}>
            Sin imagen
          </Typography>
        )}
      </Grid>

      {!readOnly && (
        <Grid item xs={12}>
          <CustomPhotoCam
            label="Capturar/Seleccionar Imagen"
            onImage={(img) => {
              if (!img?.base64Hex) {
                setLocalPreview(null)
                return
              }

              setLocalPreview(`data:image/jpeg;base64,${img.base64Hex}`)

              if (img.base64Hex.length > 255) {
                showWarning(
                  "La imagen excede 255 caracteres para apocodigo. Guárdala externamente y usa un código o URL.",
                )
                return
              }

              change("apocodigo", img.base64Hex)
            }}
            initialImage={currentPreview}
            cropAspect={1}
            compressOptions={{ maxSizeMB: 0.15, maxWidthOrHeight: 120, useWebWorker: true }}
          />
        </Grid>
      )}
    </Section>
  )
}

export default ImagenesSection

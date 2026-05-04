import React, { useRef, useState, useEffect, useCallback, lazy, Suspense } from "react"
import PropTypes from "prop-types"
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Avatar,
  Typography,
  Slider,
  Stack,
  Alert,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material"
import {
  CameraAlt as CameraAltIcon,
  UploadFile as UploadFileIcon,
  Close as CloseIcon,
  FlipCameraAndroid as FlipCameraIcon,
  Crop as CropIcon,
  ZoomIn as ZoomInIcon,
} from "@mui/icons-material"

// Carga diferida de componentes pesados
const Webcam = lazy(() => import("react-webcam"))
const Cropper = lazy(() => import("react-easy-crop"))

// Utilidades auxiliares
async function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (err) => reject(err))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })
}

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180
}

async function getCroppedImg(imageSrcLocal, pixelCrop, rotation = 0) {
  try {
    const image = await createImage(imageSrcLocal)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    const rotRad = getRadianAngle(rotation)

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Configurar contexto de canvas
    ctx.translate(-pixelCrop.x, -pixelCrop.y)
    ctx.translate(image.width / 2, image.height / 2)
    ctx.rotate(rotRad)
    ctx.translate(-image.width / 2, -image.height / 2)

    ctx.drawImage(image, 0, 0)

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas está vacío"))
          return
        }
        const fileUrl = URL.createObjectURL(blob)
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result)
        }
        reader.onerror = () => {
          reject(new Error("Error al leer el blob"))
        }
        reader.readAsDataURL(blob)
      }, "image/jpeg")
    })
  } catch (error) {
    console.error("Error al recortar la imagen:", error)
    throw error
  }
}

async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = () => reject(new Error("Error al convertir blob a DataURL"))
    reader.readAsDataURL(blob)
  })
}

// Componente de carga para Suspense
const Loader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height={200}>
    <CircularProgress />
  </Box>
)

// Modal para vista fullscreen
const FullscreenImageModal = ({ open, onClose, imageSrc }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: isMobile ? 1 : 2,
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "relative",
            maxWidth: "90vw",
            maxHeight: "90vh",
            bgcolor: "background.paper",
            borderRadius: 1,
            overflow: "hidden",
            boxShadow: 24,
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.5)",
              color: "white",
              zIndex: 1,
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.7)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={imageSrc}
            alt="Vista previa completa"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </Box>
      </Fade>
    </Modal>
  )
}

FullscreenImageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageSrc: PropTypes.string,
}

// Componente principal
const CameraUpload = ({
  label = "Imagen",
  onImage = () => {},
  defaultFacingMode = "user",
  accept = "image/*",
  cropAspect = 1,
  compressOptions = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true },
  open: externalOpen = null,
  onClose: externalOnClose = null,
  initialImage = null,
  maxFileSizeMB = 5,
  allowedFileTypes = ["image/jpeg", "image/png", "image/webp"],
  resetToInitialImageButton = false,
  onResetImage = () => {},
  showUploadButton = true,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const webcamRef = useRef(null)
  const fileInputRef = useRef(null)

  // Estado interno si no se controla externamente
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== null ? externalOpen : internalOpen
  const setOpen = externalOnClose || setInternalOpen

  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [facingMode, setFacingMode] = useState(defaultFacingMode)
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [finalPreview, setFinalPreview] = useState(initialImage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState("camera")
  const [cameraReady, setCameraReady] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

  // Sincronizar finalPreview con initialImage cuando cambie
  useEffect(() => {
    setFinalPreview(initialImage)
  }, [initialImage])

  // Efecto para obtener dispositivos solo cuando sea necesario
  useEffect(() => {
    let isMounted = true

    async function getDevices() {
      try {
        // Solo intentar acceder a los dispositivos si el modal está abierto
        if (open && mode === "camera") {
          const allDevices = await navigator.mediaDevices.enumerateDevices()
          if (isMounted) {
            const videoInputs = allDevices.filter((d) => d.kind === "videoinput")
            setDevices(videoInputs)
            if (videoInputs.length && !selectedDeviceId) {
              setSelectedDeviceId(videoInputs[0].deviceId)
            }
          }
        }
      } catch (e) {
        console.warn("No se pudieron enumerar dispositivos:", e)
        if (isMounted) {
          setError("No se pudo acceder a los dispositivos de cámara")
        }
      }
    }

    if (open) {
      // Pequeño retraso para mejorar la experiencia de usuario
      const timer = setTimeout(() => {
        getDevices()
      }, 100)

      return () => {
        isMounted = false
        clearTimeout(timer)
      }
    }
  }, [open, mode, selectedDeviceId])

  // Limpiar recursos cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setImageSrc(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setError(null)
      setCameraReady(false)
      setIsProcessing(false)

      // Limpiar input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = null
      }
    }
  }, [open])

  const videoConstraints = selectedDeviceId
    ? { deviceId: selectedDeviceId }
    : { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }

  const openDialog = (dialogMode = "camera") => {
    setMode(dialogMode)
    setOpen(true)
  }

  const closeDialog = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  // Capturar desde la cámara
  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return

    try {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        setImageSrc(imageSrc)
        setError(null)
      }
    } catch (err) {
      console.error("Error al capturar imagen:", err)
      setError("Error al capturar la imagen")
    }
  }, [webcamRef])

  // Manejar subida de archivo
  const handleUpload = useCallback(
    async (e) => {
      const file = e.target.files && e.target.files[0]
      if (!file) return

      // Validaciones de archivo
      if (!allowedFileTypes.includes(file.type)) {
        setError(`Tipo de archivo no permitido. Use: ${allowedFileTypes.join(", ")}`)
        return
      }

      if (file.size > maxFileSizeMB * 1024 * 1024) {
        setError(`El archivo es demasiado grande. Tamaño máximo: ${maxFileSizeMB}MB`)
        return
      }

      try {
        const reader = new FileReader()
        reader.onload = function (ev) {
          setImageSrc(ev.target.result)
          setError(null)
        }
        reader.onerror = () => {
          setError("Error al leer el archivo")
        }
        reader.readAsDataURL(file)
      } catch (err) {
        console.error("Error al procesar archivo:", err)
        setError("Error al procesar el archivo")
      }
    },
    [allowedFileTypes, maxFileSizeMB],
  )

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  // Procesar imagen recortada y comprimida
  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels || isProcessing) return

    setIsProcessing(true)
    setLoading(true)
    setError(null)

    try {
      const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      const blobFromDataUrl = await (await fetch(croppedDataUrl)).blob()

      // Cargar imageCompression solo cuando sea necesario
      const compression = await import("browser-image-compression")
      const compressedBlob = await compression.default(blobFromDataUrl, compressOptions)

      const compressedBase64 = await blobToDataURL(compressedBlob)
      const base64Hex = compressedBase64.split(",")[1]

      // Actualizar estado interno y notificar al componente padre
      setFinalPreview(compressedBase64)
      onImage({ base64: compressedBase64, base64Hex, blob: compressedBlob })
      setLoading(false)
      setIsProcessing(false)
      closeDialog()
    } catch (e) {
      console.error("Error al procesar la imagen:", e)
      setError("Error al procesar la imagen")
      setLoading(false)
      setIsProcessing(false)
    }
  }, [imageSrc, croppedAreaPixels, rotation, compressOptions, onImage, closeDialog, isProcessing])

  const handleRemove = useCallback(() => {
    setImageSrc(null)
    setFinalPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = null
    onImage(null)
  }, [onImage])

  // Función para restaurar la imagen inicial
  const handleResetImage = useCallback(() => {
    setFinalPreview(initialImage)
    onResetImage()
  }, [initialImage, onResetImage])

  const flipCamera = useCallback(() => {
    setFacingMode(facingMode === "user" ? "environment" : "user")
  }, [facingMode])

  const handleUserMedia = useCallback(() => {
    setCameraReady(true)
  }, [])

  const handleUserMediaError = useCallback(() => {
    setError("No se puede acceder a la cámara. Verifica los permisos.")
    setCameraReady(false)
  }, [])

  // Manejar cambio de archivo y abrir diálogo
  const handleFileChange = useCallback(
    (e) => {
      openDialog("upload")
      handleUpload(e)
    },
    [handleUpload],
  )

  // Abrir vista fullscreen
  const handleOpenFullscreen = useCallback(() => {
    if (finalPreview) {
      setFullscreenOpen(true)
    }
  }, [finalPreview])

  // Cerrar vista fullscreen
  const handleCloseFullscreen = useCallback(() => {
    setFullscreenOpen(false)
  }, [])

  return (
    <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", p: isMobile ? 1 : 2 }}>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={finalPreview}
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: "grey.100",
                    cursor: finalPreview ? "pointer" : "default",
                    "&:hover": finalPreview
                      ? {
                          opacity: 0.8,
                          transform: "scale(1.05)",
                          transition: "all 0.2s ease-in-out",
                        }
                      : {},
                  }}
                  onClick={handleOpenFullscreen}
                >
                  {!finalPreview && <CameraAltIcon />}
                </Avatar>
                {finalPreview && (
                  <IconButton
                    onClick={handleOpenFullscreen}
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      bgcolor: "primary.main",
                      color: "white",
                      width: 28,
                      height: 28,
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    }}
                  >
                    <ZoomInIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
            </Grid>

            <Grid item xs>
              <Stack spacing={1}>
                <Button
                  startIcon={<CameraAltIcon />}
                  variant="contained"
                  onClick={() => openDialog("camera")}
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                >
                  Tomar foto
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  id="file-upload"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                <label htmlFor="file-upload">
                  {showUploadButton && (
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadFileIcon />}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                    >
                      Subir imagen
                    </Button>
                  )}
                </label>
              </Stack>
            </Grid>
          </Grid>

          <>
            {finalPreview && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <Button color="error" onClick={handleRemove} size={isMobile ? "small" : "medium"}>
                  Eliminar imagen
                </Button>
              </Box>
            )}

            {resetToInitialImageButton && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <Button color="secondary" onClick={handleResetImage} size={isMobile ? "small" : "medium"}>
                  Restaurar imagen original
                </Button>
              </Box>
            )}
          </>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={!isProcessing ? closeDialog : undefined}
        fullWidth
        fullScreen={isMobile}
        maxWidth="md"
        PaperProps={{ sx: { maxHeight: "90vh" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 1,
            pt: isMobile ? 2 : 1,
          }}
        >
          <Typography variant="h6">{mode === "camera" ? "Tomar foto" : "Subir imagen"}</Typography>
          <IconButton onClick={!isProcessing ? closeDialog : undefined} size="large" disabled={isProcessing}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  position: "relative",
                  height: isMobile ? 300 : 400,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                {!imageSrc && mode === "camera" && (
                  <Box sx={{ height: "100%" }}>
                    <Suspense fallback={<Loader />}>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        screenshotQuality={0.9}
                        onUserMedia={handleUserMedia}
                        onUserMediaError={handleUserMediaError}
                      />
                    </Suspense>

                    {!cameraReady && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "rgba(0,0,0,0.7)",
                          zIndex: 10,
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    )}

                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1,
                        bgcolor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        zIndex: 5,
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={handleCapture}
                        startIcon={<CameraAltIcon />}
                        size={isMobile ? "small" : "large"}
                        disabled={!cameraReady || isProcessing}
                      >
                        Capturar
                      </Button>
                    </Box>
                  </Box>
                )}

                {imageSrc && (
                  <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                    <Suspense fallback={<Loader />}>
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={cropAspect}
                        rotation={rotation}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        onCropComplete={onCropComplete}
                        cropShape={cropAspect === 1 ? "round" : "rect"}
                        showGrid={false}
                        style={{
                          containerStyle: {
                            borderRadius: "4px",
                            backgroundColor: "#f5f5f5",
                          },
                        }}
                      />
                    </Suspense>
                  </Box>
                )}

                {mode === "upload" && !imageSrc && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      flexDirection: "column",
                      p: 3,
                    }}
                  >
                    <UploadFileIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                    <Typography color="text.secondary" textAlign="center">
                      Seleccione una imagen para recortar
                    </Typography>
                  </Box>
                )}
              </Box>

              {mode === "camera" && !imageSrc && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 120, width: isMobile ? "100%" : "auto" }}>
                      <InputLabel id="camera-device-label">Cámara</InputLabel>
                      <Select
                        labelId="camera-device-label"
                        value={selectedDeviceId || ""}
                        label="Cámara"
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        disabled={isProcessing}
                      >
                        {devices.map((d) => (
                          <MenuItem key={d.deviceId} value={d.deviceId}>
                            {d.label || `Cámara ${d.deviceId.slice(0, 5)}...`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button
                      variant="outlined"
                      startIcon={<FlipCameraIcon />}
                      onClick={flipCamera}
                      fullWidth={isMobile}
                      size={isMobile ? "small" : "medium"}
                      disabled={isProcessing}
                    >
                      {facingMode === "user" ? "Frontal" : "Trasera"}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={5}>
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Controles de edición
                </Typography>

                {imageSrc ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Zoom: {Math.round(zoom * 100)}%
                      </Typography>
                      <Slider
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(_, v) => setZoom(v)}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                        disabled={isProcessing}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Rotación: {rotation}°
                      </Typography>
                      <Slider
                        value={rotation}
                        min={0}
                        max={360}
                        step={1}
                        onChange={(_, v) => setRotation(v)}
                        valueLabelDisplay="auto"
                        disabled={isProcessing}
                      />
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleConfirm}
                      disabled={loading || isProcessing}
                      startIcon={loading ? <CircularProgress size={16} /> : <CropIcon />}
                      size={isMobile ? "small" : "medium"}
                    >
                      {loading ? "Procesando..." : "Confirmar recorte"}
                    </Button>

                    <Chip label={`Relación de aspecto: ${cropAspect}`} size="small" sx={{ mt: 2 }} variant="outlined" />
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {mode === "camera"
                      ? "Capture una foto o seleccione un archivo para comenzar a editar"
                      : "Suba una imagen para comenzar a editar"}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={closeDialog} size={isMobile ? "small" : "medium"} disabled={isProcessing}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para vista fullscreen */}
      <FullscreenImageModal open={fullscreenOpen} onClose={handleCloseFullscreen} imageSrc={finalPreview} />
    </Box>
  )
}

CameraUpload.propTypes = {
  label: PropTypes.string,
  onImage: PropTypes.func,
  defaultFacingMode: PropTypes.oneOf(["user", "environment"]),
  accept: PropTypes.string,
  cropAspect: PropTypes.number,
  compressOptions: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  initialImage: PropTypes.string,
  maxFileSizeMB: PropTypes.number,
  allowedFileTypes: PropTypes.arrayOf(PropTypes.string),
  resetToInitialImageButton: PropTypes.bool,
  onResetImage: PropTypes.func,
  showUploadButton: PropTypes.bool, // Nueva propType
}

export default CameraUpload

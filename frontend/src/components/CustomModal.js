import React from "react"
import { Modal, Box, Typography, Button, Stack, IconButton, Divider } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"

const CustomModal = ({
  // Control básico
  open,
  onClose,

  // Contenido
  title,
  subtitle,
  children,

  // Acciones
  actions = [],
  showDefaultActions = false,
  onConfirm,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  disableConfirm = false,

  // Estilo y Dimensiones
  maxWidth = 400,
  fullWidth = false,
  width,
  padding = 4,
  showCloseButton = true,
  showDivider = false,

  // Validación
  hideCancelButton = false,

  // Customización de dimensiones
  height,
  minHeight,
  maxHeight,
  fullScreen = false, // Nueva prop para pantalla completa real
}) => {
  const getModalStyle = () => {
    // Pantalla completa real (sin bordes)
    if (fullScreen) {
      return {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        bgcolor: "background.paper",
        p: padding,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }
    }

    // Casi pantalla completa (98% como tenías)
    if (fullWidth) {
      return {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: width || "98%", //  Respeta width si se proporciona
        height: height || "98%", //  Respeta height si se proporciona
        minHeight: minHeight || "98%", //  Respeta minHeight si se proporciona
        maxHeight: maxHeight || "98%", //  Respeta maxHeight si se proporciona
        bgcolor: "background.paper",
        boxShadow: 24,
        p: padding,
        overflowY: "auto",
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
      }
    }

    // Ancho específico
    if (width) {
      return {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width,
        maxWidth: "90vw",
        height, // Respeta height
        minHeight, // Respeta minHeight
        maxHeight: maxHeight || "90vh", //  Respeta maxHeight
        bgcolor: "background.paper",
        boxShadow: 24,
        p: padding,
        borderRadius: 2,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }
    }

    // Modal normal
    return {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: maxWidth,
      maxWidth: "90vw",
      height, // Respeta height
      minHeight, // Respeta minHeight
      maxHeight: maxHeight || "90vh", // Respeta maxHeight
      bgcolor: "background.paper",
      boxShadow: 24,
      p: padding,
      borderRadius: 2,
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
  }

  const modalStyle = getModalStyle()
  const isFullScreen = fullScreen || fullWidth

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        {/* Header Sticky */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
            position: isFullScreen ? "sticky" : "static",
            top: isFullScreen ? -padding * 8 : "auto",
            bgcolor: "background.paper",
            zIndex: 10,
            py: 1,
            flexShrink: 0,
          }}
        >
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {showCloseButton && (
            <IconButton onClick={onClose} size="small" sx={{ flexShrink: 0 }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {showDivider && <Divider sx={{ mb: 2 }} />}

        {/* Contenido Scrollable */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            minHeight: 0,
          }}
        >
          <Stack spacing={3}>{children}</Stack>
        </Box>

        {/* Footer Sticky */}
        {(showDefaultActions || actions.length > 0) && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: "flex-end",
              mt: 3,
              pt: 2,
              position: isFullScreen ? "sticky" : "static",
              bottom: isFullScreen ? -padding * 8 : "auto",
              bgcolor: "background.paper",
              zIndex: 10,
              flexShrink: 0,
              borderTop: showDivider ? "1px solid" : "none",
              borderColor: "divider",
            }}
          >
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || "outlined"}
                disabled={action.disabled}
                color={action.color}
                startIcon={action.icon}
                size={action.size}
              >
                {action.label}
              </Button>
            ))}

            {showDefaultActions && (
              <>
                {!hideCancelButton && (
                  <Button onClick={onClose} variant="outlined">
                    {cancelLabel}
                  </Button>
                )}
                <Button onClick={handleConfirm} variant="contained" disabled={disableConfirm}>
                  {confirmLabel}
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>
    </Modal>
  )
}

export default CustomModal

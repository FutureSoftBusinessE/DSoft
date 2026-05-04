import React, { useState } from "react"
import { Avatar, Modal, Box, IconButton, Fade, Backdrop } from "@mui/material"
import { Close as CloseIcon, CameraAlt as CameraAltIcon, ZoomIn as ZoomInIcon } from "@mui/icons-material"

const CustomImageAvatar = ({
  usrimagen,
  alt = "Imagen de usuario",
  size = 100,
  showModal = true,
  onAvatarClick,
  sx = {},
  ...props
}) => {
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(false)

  const handleAvatarClick = (event) => {
    if (onAvatarClick) {
      onAvatarClick(event)
    }

    if (showModal && usrimagen) {
      setOpen(true)
    }
  }

  const handleCloseModal = () => {
    setOpen(false)
    setZoom(false)
  }

  const toggleZoom = () => {
    setZoom(!zoom)
  }

  const avatarSx = {
    width: size,
    height: size,
    bgcolor: "grey.100",
    cursor: usrimagen && showModal ? "pointer" : "default",
    "&:hover":
      usrimagen && showModal
        ? {
            opacity: 0.8,
            transform: "scale(1.05)",
            transition: "all 0.2s ease-in-out",
            boxShadow: 3,
          }
        : {},
    ...sx,
  }

  return (
    <>
      {/* Avatar */}
      <Avatar
        src={usrimagen ? `data:image/jpeg;base64,${usrimagen}` : undefined}
        sx={avatarSx}
        onClick={handleAvatarClick}
        alt={alt}
        {...props}
      >
        {!usrimagen && <CameraAltIcon />}

        {/* Indicador de que es clickeable */}
        {usrimagen && showModal && (
          <ZoomInIcon
            sx={{
              position: "absolute",
              bottom: 4,
              right: 4,
              fontSize: 16,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: "50%",
              padding: 0.5,
            }}
          />
        )}
      </Avatar>

      {/* Modal para imagen completa (solo si showModal es true) */}
      {showModal && (
        <Modal
          open={open}
          onClose={handleCloseModal}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Fade in={open}>
            <Box
              sx={{
                position: "relative",
                outline: "none",
                maxWidth: "90vw",
                maxHeight: "90vh",
              }}
            >
              {/* Botón de cerrar */}
              <IconButton
                onClick={handleCloseModal}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                  },
                  zIndex: 1,
                }}
              >
                <CloseIcon />
              </IconButton>

              {/* Botón de zoom */}
              <IconButton
                onClick={toggleZoom}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 56,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                  },
                  zIndex: 1,
                }}
              >
                <ZoomInIcon />
              </IconButton>

              {/* Imagen */}
              <Box
                component="img"
                src={`data:image/jpeg;base64,${usrimagen}`}
                alt={alt}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "90vh",
                  objectFit: "contain",
                  cursor: zoom ? "zoom-out" : "zoom-in",
                  transform: zoom ? "scale(1.5)" : "scale(1)",
                  transition: "transform 0.3s ease-in-out",
                  boxShadow: 24,
                  borderRadius: 1,
                }}
                onClick={toggleZoom}
              />
            </Box>
          </Fade>
        </Modal>
      )}
    </>
  )
}

export default CustomImageAvatar

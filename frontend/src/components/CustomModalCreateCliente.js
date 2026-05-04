import React, { useState } from "react"
import { Box, TextField, MenuItem, Button, Grid, Typography, Paper, Modal, IconButton } from "@mui/material"
import { styled } from "@mui/system"
import { useMutation, api } from "../api"
import CustomBackdrop from "./CustomBackdrop"
import CloseIcon from "@mui/icons-material/Close"

const ModalContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  maxWidth: "95vw",
  maxHeight: "90vh",
  overflow: "auto",
  backgroundColor: theme.palette.background.paper,
  boxShadow: 24,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0),
  outline: "none",
}))

const ModalHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
}))

const Section = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  position: "relative",
  border: "1px solid #0072B1",
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  position: "absolute",
  top: "-0.75em",
  left: "1em",
  backgroundColor: theme.palette.background.paper,
  padding: "0 16px",
}))

const FlexRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  flexDirection: "column",
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
  },
}))

const tipoIdentificacionOptions = [
  { value: "C", label: "Cédula" },
  { value: "R", label: "RUC" },
  { value: "P", label: "Pasaporte" },
]

const CustomModalCreateCliente = ({
  open = false,
  onClose,
  onSuccess,
  defaultValues = {},
  resetOnClose = true,
  title = "Crear Nuevo Cliente",
}) => {
  const [formData, setFormData] = useState({
    tipoIdentificacion: "",
    nIdentificacion: "",
    nombre: "",
    direccion: "",
    telefono1: "",
    telefono2: "",
    fax: "",
    celular: "",
    email: "",
    ...defaultValues,
  })

  React.useEffect(() => {
    if (open && defaultValues) {
      setFormData((prev) => ({
        ...prev,
        ...defaultValues,
      }))
    }
  }, [open, defaultValues])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const { mutate: createNewCliente, isPending: isCreatingNewCliente } = useMutation({
    fn: async (data) => {
      const response = await api.post("/CustomModalCreateCliente/createNewCliente", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data)
      }

      if (resetOnClose) {
        resetForm()
      }

      if (onClose) {
        onClose()
      }
    },
  })

  const resetForm = () => {
    setFormData({
      tipoIdentificacion: "",
      nIdentificacion: "",
      nombre: "",
      direccion: "",
      telefono1: "",
      telefono2: "",
      fax: "",
      celular: "",
      email: "",
    })
  }

  const validateForm = () => {
    const { tipoIdentificacion, nIdentificacion, nombre } = formData

    if (!tipoIdentificacion) {
      alert("Seleccione el tipo de identificación")
      return false
    }

    if (!nIdentificacion) {
      alert("Ingrese el número de identificación")
      return false
    }

    if (!nombre) {
      alert("Ingrese el nombre del cliente")
      return false
    }

    // Validaciones específicas por tipo de identificación
    if (tipoIdentificacion === "C" && nIdentificacion.length !== 10) {
      alert("La cédula debe tener 10 dígitos")
      return false
    }

    if (tipoIdentificacion === "R" && nIdentificacion.length !== 13) {
      alert("El RUC debe tener 13 dígitos")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    const request = {
      //   tipcodigo: "001",
      cliidentifica: formData.tipoIdentificacion,
      cliruc: formData.nIdentificacion,
      clinombre: formData.nombre,
      clidirec: formData.direccion || "",
      clitelef1: formData.telefono1 || "",
      clitelef2: formData.telefono2 || "",
      cliintersec: formData.celular || "",
      clifax: formData.fax || "",
      cliemail: formData.email || "",
    }
    createNewCliente(request)
  }

  const handleClose = () => {
    if (resetOnClose) {
      resetForm()
    }
    if (onClose) {
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-create-cliente"
      aria-describedby="modal-create-cliente-description"
    >
      <>
        <CustomBackdrop isLoading={isCreatingNewCliente} />
        <ModalContainer>
          <ModalHeader>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            <IconButton
              onClick={handleClose}
              sx={{
                color: "inherit",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
              disabled={isCreatingNewCliente}
            >
              <CloseIcon />
            </IconButton>
          </ModalHeader>

          <Box sx={{ p: 3 }}>
            <Section elevation={0}>
              <SectionTitle variant="subtitle1">Datos Generales</SectionTitle>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FlexRow>
                    <TextField
                      select
                      label="Tipo de Identificación"
                      name="tipoIdentificacion"
                      value={formData.tipoIdentificacion}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      required
                      disabled={isCreatingNewCliente}
                    >
                      {tipoIdentificacionOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Número de Identificación"
                      name="nIdentificacion"
                      value={formData.nIdentificacion}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      required
                      autoComplete="off"
                      disabled={isCreatingNewCliente}
                    />
                  </FlexRow>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Nombre *"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    required
                    autoComplete="off"
                    disabled={isCreatingNewCliente}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Dirección"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    autoComplete="off"
                    disabled={isCreatingNewCliente}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FlexRow>
                    <TextField
                      label="Teléfono 1"
                      name="telefono1"
                      value={formData.telefono1}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      autoComplete="off"
                      disabled={isCreatingNewCliente}
                    />
                    <TextField
                      label="Teléfono 2"
                      name="telefono2"
                      value={formData.telefono2}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      autoComplete="off"
                      disabled={isCreatingNewCliente}
                    />
                  </FlexRow>
                </Grid>

                <Grid item xs={12}>
                  <FlexRow>
                    <TextField
                      label="Celular"
                      name="celular"
                      value={formData.celular}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      autoComplete="off"
                      disabled={isCreatingNewCliente}
                    />
                    <TextField
                      label="Fax"
                      name="fax"
                      value={formData.fax}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      autoComplete="off"
                      disabled={isCreatingNewCliente}
                    />
                  </FlexRow>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    autoComplete="off"
                    disabled={isCreatingNewCliente}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      onClick={handleClose}
                      disabled={isCreatingNewCliente}
                    >
                      Cancelar
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="contained"
                      color="primary"
                      style={{ backgroundColor: "#114B5E", color: "white" }}
                      fullWidth
                      onClick={handleSubmit}
                      disabled={isCreatingNewCliente}
                    >
                      {isCreatingNewCliente ? "Creando..." : "Crear Cliente"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Section>
          </Box>
        </ModalContainer>
      </>
    </Modal>
  )
}

export default CustomModalCreateCliente

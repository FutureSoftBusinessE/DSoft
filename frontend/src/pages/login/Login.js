/* eslint-disable no-unused-vars */
/* eslint-disable eqeqeq */
import React, { useContext, useState, useEffect } from "react"
import { TextField, Button, Paper, Typography, Grid, Container, CircularProgress } from "@mui/material"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import Swal from "sweetalert2"

// My assests
import loginImages from "../helpers/login/getImgs"
import { useNavigate } from "react-router-dom"
import CustomError from "../errors/customError"
import fetchwrapper from "../../services/interceptors/fetchwrapper"

// STYLES
const StyledPaper = styled("div")(({ theme }) => ({
  margin: theme.spacing(8, 4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}))

const StyledForm = styled("form")(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(1),
}))
const StyledImg = styled("img")(({ theme }) => ({
  width: "50px",
  height: "50px",
  marginRight: theme.spacing(1),
}))

const StyledSubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
  backgroundColor: "#406AF5",
  color: "#ffffff", // Cambia el color de la letra para que sea visible en el fondo
}))

// const useStyles = makeStyles((theme) => ({
//   root: {
//     height: "100vh",
//   },
//   paper: {
//     margin: theme.spacing(8, 4),
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//   },
//   form: {
//     width: "100%", // Fix IE 11 issue.
//     marginTop: theme.spacing(1),
//   },
//   submit: {
//     margin: theme.spacing(3, 0, 2),
//     backgroundColor: "#406AF5",
//   },

//   img: { width: "50px", height: "50px", marginRight: "8px" },
// }));

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  // Cada vez que cargue esta pagina por primera vez
  // el local storage debe vaciarse
  useEffect(() => {
    localStorage.clear()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    // validate if user exists in the db
    try {
      if (!email.match(/[^\s@]+@[^\s@]+/gi)) {
        throw new CustomError("Ese usuario no está registrado")
      }

      setLoading(true) // Inicia el estado de carga

      const options = {
        method: "POST",
        body: JSON.stringify({
          user: email,
          // user: "\u00adv}xg@Practi"
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
      console.log(email)
      let response = await fetchwrapper("/login/usuario_existe", options)
      response = await response.json()
      /* {
        "message": "El usuario existe",
        "status": "ok",
        "usuario": {
            "cliciagrupo": "Practi",
            "cliciausu": "fsoft"
            }
          } */
      console.log(response)

      if (response.status === "ok") {
        localStorage.setItem("cliciausu", response.usuario.cliciausu)
        localStorage.setItem("cliciagrupo", response.usuario.cliciagrupo)
        console.log(response.status)
        navigate("/loginInner")
      }
      if (response.status == "error") {
        throw new CustomError("Ese usuario no está registrado")
      }
    } catch (err) {
      if (err instanceof CustomError) {
        console.error(err)
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: err.message,
        })
        return
      }
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Algo sucedió mal!",
      })
    } finally {
      setLoading(false) // Finaliza el estado de carga
    }
  }

  return (
    <Container maxWidth={false} style={{ height: "100vh" }} justify="center">
      <Grid container justifyContent="center" alignItems="center" style={{ height: "100%" }}>
        <Grid item xs={12} sm={8} md={6} lg={4}>
          <Paper elevation={3} style={{ padding: "32px" }}>
            <StyledPaper>
              <Grid container justifyContent="flex-start" alignItems="center">
                <Grid item style={{ paddingBottom: "20px" }}>
                  <StyledImg src={loginImages.logoSmall} alt="Logo de la empresa" />
                </Grid>
                <Typography component="h1" variant="h5" style={{ fontWeight: "bolder", fontSize: "15px" }}>
                  FutureSoft Business Service
                </Typography>
              </Grid>

              <StyledForm onSubmit={handleSubmit}>
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Usuario"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <StyledSubmitButton type="submit" fullWidth variant="contained" style={{ backgroundColor: "#196C87" }}>
                  {loading ? ( // Renderiza el spinner si está cargando
                    <CircularProgress color="inherit" size={24} />
                  ) : (
                    "Siguiente"
                  )}
                </StyledSubmitButton>
              </StyledForm>
            </StyledPaper>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Login

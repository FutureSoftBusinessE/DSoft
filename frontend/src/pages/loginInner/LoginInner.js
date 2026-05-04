/* eslint-disable no-unused-vars */
/* eslint-disable eqeqeq */
import React, { useContext, useEffect, useRef, useState } from "react"
import {
  Container,
  Grid,
  TextField,
  MenuItem,
  Select,
  Paper,
  Button,
  Typography,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormControl,
  Tooltip,
} from "@mui/material"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"

import { Visibility, VisibilityOff } from "@mui/icons-material"
import Swal from "sweetalert2"
import loginImages from "../helpers/login/getImgs"
import { LoginContext } from "../contexts/LoginContext"
import { useNavigate } from "react-router-dom"
import CustomError from "../errors/customError"
import fetchwrapper from "../../services/interceptors/fetchwrapper"
import { FcDownLeft } from "react-icons/fc"

const options = [
  { value: "option1", label: "Opción 1" },
  { value: "option2", label: "Opción 2" },
  { value: "option3", label: "Opción 3" },
]

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

const StyledCombobox = styled(Select)(({ theme }) => ({
  marginBottom: "30px",
  display: "flex",
  alignItems: "center",
}))

// const useStyles = makeStyles((theme) => ({
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

//   combobox: {
//     marginBottom: "30px",
//     display: "flex",
//     alignItems: "center",
//   },
// }));
const LoginInner = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = React.useState(false)

  const handleClickShowPassword = () => setShowPassword((show) => !show)

  /*   const handleMouseDownPassword = (event) => {
      event.preventDefault();
    }; */

  const [selectedValue1, setSelectedValue1] = useState("")
  const [selectedValue2, setSelectedValue2] = useState("")
  // userExists.usuario
  const [userExists, setUserExists] = useState({
    usuario: {
      cliciausu: localStorage.getItem("cliciausu"),
      cliciagrupo: localStorage.getItem("cliciagrupo"),
    },
  })

  const [companies, setCompanies] = useState([])
  const [locations, setLocations] = useState([])
  const [password, setPassword] = useState("")

  const [companySelected, setCompanySelected] = useState({})
  const [locationSelected, setLocationSelected] = useState({})

  useEffect(() => {
    // Verify first login exists before fetch companies
    if ((localStorage.getItem("cliciausu") && localStorage.getItem("cliciausu")) == null) {
      navigate("/")
      return
    }

    const getCompanies = async () => {
      const options = {
        method: "POST",
        body: JSON.stringify(userExists.usuario),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      try {
        let response = await fetchwrapper("/login/companias_del_usuario", options)

        response = await response.json()
        /* {
          "data": [
              {
                  "cliciaciacodigo": "01",
                  "cliciacianombre": "PRACTICASA",
                  "clicianonBD": "SiacPracticasa",
                  "cliciarutaBD": "fsoftapptest.futuresoft-ec.com,14666"
              },
              {
                  "cliciaciacodigo": "02",
                  "cliciacianombre": "MADIVE",
                  "clicianonBD": "SiacPracticasa",
                  "cliciarutaBD": "fsoftapptest.futuresoft-ec.com,14666"
              }
          ],
          "status": "ok"
      } */
        setCompanies(response.data)
        console.log(response.data)
      } catch (e) {
        // throw new Error("No se encontro nada")
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "No se encontraron comapañias",
        })
      }
    }

    getCompanies()
  }, [])

  useEffect(() => {
    const company = companies.find((company) => company.cliciacianombre == selectedValue1)
    console.log(company)
    setCompanySelected(company)
    if (!company) {
      return setLocations([])
    }

    const getLocations = async () => {
      console.log(company, "---------")
      const options = {
        method: "POST",
        body: JSON.stringify({
          user: userExists.usuario.cliciausu,
          seleccion: company,
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      try {
        let response = await fetchwrapper("/login/get_localidad", options)
        response = await response.json()
        console.log(response)
        setLocations(response)
        // console.log(response.data)
      } catch (e) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "No se encontraron localidades",
        })
      }
    }

    getLocations()

    console.log("hereeeeeeee")
  }, [selectedValue1])

  useEffect(() => {
    if (!locations) {
      return
    }
    const location = locations.find((location) => location.locdescri == selectedValue2)
    console.log(location, "ñññ")
    setLocationSelected(location)
  }, [selectedValue2])

  const handleChange1 = (event) => {
    console.log(event.target.value)
    setSelectedValue1(event.target.value)
  }

  const handleChange2 = (event) => {
    console.log(event.target.value)
    setSelectedValue2(event.target.value)
  }

  const handlePassword = (event) => {
    setPassword(event.target.value)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // verify if all inputs have value/^[a-zA-Z0-9]+$/

    if (!password || password.trim() === "") {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Contraseña inválida",
      })

      console.log(password, selectedValue1, selectedValue2)
      return
    }

    if (password.length > 10) {
      return Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Su contraseña no debe tener mas de 10 caracteres",
      })
    }

    if (selectedValue1 === null || selectedValue1 === "" || selectedValue2 === null || selectedValue2 === "") {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Complete los campos compañia y localidad",
      })

      console.log(password, selectedValue1, selectedValue2)
      return
    }

    console.log(userExists.usuario.cliciausu, password)
    // implentation of jwt
    try {
      const options = {
        method: "POST",
        body: JSON.stringify({
          user: userExists.usuario.cliciausu,
          password,
          seleccion: {},
          clicianonBD: companySelected.clicianonBD,
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      let response = await fetchwrapper("/login/inicio_sesion", options)
      response = await response.json()

      console.log(response)

      if (response.status === "ok") {
        console.log(response.status)

        try {
          const options = {
            method: "POST",
            body: JSON.stringify({
              user: localStorage.getItem("cliciausu"),
              password,
              seleccion: companySelected,
              localidad: locationSelected,
            }),
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }

          let response = await fetchwrapper("/login/generate_token", options)
          response = await response.json()

          if (response.status === "ok") {
            localStorage.setItem("jwt", JSON.stringify(response.data))
            localStorage.setItem("accessToken", JSON.stringify(response.token))
            console.log(localStorage.getItem("accessToken"))
          } else {
            throw new Error("No token")
          }

          let responseOpcionesAcciones = await fetchwrapper("/menu/get_menu_opciones_acciones")
          responseOpcionesAcciones = await responseOpcionesAcciones.json()
          if (responseOpcionesAcciones.status === "ok") {
            localStorage.setItem("menuAcciones", JSON.stringify(responseOpcionesAcciones.data))
          } else {
            throw new Error("No se pudo obtener los permisos del menu")
          }
          navigate("/home", {
            state: { loginInfoFrontend: { user: localStorage.getItem("cliciausu"), password } },
          })
        } catch (err) {
          console.error(err)
        }
      }

      if (response.status == "error") {
        throw new Error("error")
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Contraseña inválida",
      })
      console.log(err)
    }
  }

  return (
    <Container maxWidth={false} style={{ height: "100vh" }} justify="center">
      <Grid container justifyContent="center" alignItems="center" style={{ height: "100%" }}>
        <Grid item xs={12} sm={8} md={6} lg={4}>
          <Paper elevation={3} style={{ padding: "32px" }}>
            <StyledPaper>
              <div style={{ width: "100%", textAlign: "right" }}>
                <Tooltip title="Salir del Sistema">
                  <IconButton color="warning" onClick={() => navigate("/login")}>
                    <FcDownLeft />
                  </IconButton>
                </Tooltip>
              </div>
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
                  value={userExists.usuario.cliciausu}
                  disabled
                />
                {/* <TextField
                  variant="outlined"
                  label="Contraseña"
                  type="password"
                  margin="normal"
                  onChange={handlePassword}
                  required
                  fullWidth
                /> */}

                <FormControl style={{ m: 1, width: "100%" }} variant="outlined" onChange={handlePassword}>
                  <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-password"
                    type={showPassword ? "text" : "password"}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Password"
                  />
                </FormControl>

                <Grid item>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      marginTop: "30px",
                    }}
                  >
                    <InputLabel id="compania">Compañia</InputLabel>
                    <StyledCombobox
                      value={selectedValue1}
                      onChange={handleChange1}
                      labelId="compania"
                      style={{
                        width: "100%",
                        paddingTop: "10px",
                        textAlign: "center",
                      }}
                    >
                      <MenuItem value="">-- Seleccione una opción --</MenuItem>
                      {companies.map((company) => (
                        <MenuItem key={company.cliciaciacodigo} value={company.cliciacianombre}>
                          {company.cliciacianombre}
                        </MenuItem>
                      ))}
                    </StyledCombobox>
                  </div>
                </Grid>

                <Grid item>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <InputLabel id="localidad">Localidad</InputLabel>
                    <Select
                      value={selectedValue2}
                      onChange={handleChange2}
                      labelId="localidad"
                      style={{
                        width: "100%",
                        paddingTop: "10px",
                        textAlign: "center",
                      }}
                    >
                      <MenuItem value="">-- Seleccione una opción --</MenuItem>
                      {locations.map((location) => (
                        <MenuItem key={location.loccodigo} value={location.locdescri}>
                          {location.locdescri}
                        </MenuItem>
                      ))}
                    </Select>
                  </div>
                </Grid>
                {/* <Grid item>
          <Select value={selectedValue} onChange={handleChange}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </Grid> */}
                <StyledSubmitButton type="submit" fullWidth variant="contained" style={{ backgroundColor: "#196C87" }}>
                  Iniciar sesión
                </StyledSubmitButton>
                {/* <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                >
                  Retroceder
                </Button> */}
              </StyledForm>
            </StyledPaper>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default LoginInner

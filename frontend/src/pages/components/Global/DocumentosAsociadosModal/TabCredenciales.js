// src/components/Global/DocumentosAsociadosModal/TabCredenciales.js

import React from "react"
import { Grid, TextField, MenuItem, IconButton, InputAdornment, Typography } from "@mui/material"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"

const TabCredenciales = ({
  formCredencial,
  handleChangeCredencial,
  instituciones,
  tiposClaves,
  showPassword,
  setShowPassword,
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          select
          fullWidth
          required
          label="Institución"
          value={formCredencial.insticodigo}
          onChange={(e) => handleChangeCredencial("insticodigo", e.target.value)}
          size="small"
        >
          {instituciones.data?.map((i) => (
            <MenuItem key={i.insticodigo} value={i.insticodigo}>
              {i.instidescri}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          select
          fullWidth
          required
          label="Tipo de Clave"
          value={formCredencial.clacodigo}
          onChange={(e) => handleChangeCredencial("clacodigo", e.target.value)}
          size="small"
        >
          {tiposClaves.data?.map((t) => (
            <MenuItem key={t.clacodigo} value={t.clacodigo}>
              {t.cladescri}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="URL del sitio web"
          value={formCredencial.url}
          onChange={(e) => handleChangeCredencial("url", e.target.value)}
          size="small"
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          required
          label="Usuario"
          value={formCredencial.usuario}
          onChange={(e) => handleChangeCredencial("usuario", e.target.value)}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          required
          label="Clave"
          type={showPassword ? "text" : "password"}
          value={formCredencial.clave}
          onChange={(e) => handleChangeCredencial("clave", e.target.value)}
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Email Asociado"
          value={formCredencial.email}
          onChange={(e) => handleChangeCredencial("email", e.target.value)}
          size="small"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
          Preguntas de Seguridad (Opcional)
        </Typography>
      </Grid>

      {[1, 2, 3, 4].map((num) => (
        <React.Fragment key={num}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={`Pregunta ${num}`}
              value={formCredencial[`q${num}`]}
              onChange={(e) => handleChangeCredencial(`q${num}`, e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={`Respuesta ${num}`}
              value={formCredencial[`r${num}`]}
              onChange={(e) => handleChangeCredencial(`r${num}`, e.target.value)}
              size="small"
            />
          </Grid>
        </React.Fragment>
      ))}
    </Grid>
  )
}

export default TabCredenciales

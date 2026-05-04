import React from "react"
import { Paper, Box } from "@mui/material"

const CustomFieldset = ({ title, children, sx }) => {
  return (
    <Box sx={{ position: "relative", display: "block", width: "100%", margin: "auto", ...sx }}>
      {/* Título del Fieldset */}
      <Box
        sx={{
          position: "absolute",
          top: -10,
          left: 16,
          bgcolor: "background.paper",
          px: 1,
          fontWeight: "bolder",
          fontSize: "19px",
        }}
      >
        {title}
      </Box>

      {/* Contenedor Paper con el Fieldset */}
      <Paper elevation={3} sx={{ padding: 4, paddingTop: 5 }}>
        {children}
      </Paper>
    </Box>
  )
}

export default CustomFieldset

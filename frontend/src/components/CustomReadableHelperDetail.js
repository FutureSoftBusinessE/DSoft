import React, { useState, useEffect, useMemo, useRef, useCallback } from "react"

import { InputLabel, TextField, Box } from "@mui/material"

const CustomReadableHelperDetail = ({
  label = "", // Este va a ser el titutlo de arriba del textfield
  valueInputMain = "", // Esta es el texto que va a ser visible el input text field
  valueInputSecondary = "", // Esta es el texto que va a ser visible el input text field segundario
  placeholderInputMain = "", // Este es el placeholder  que se muestra en el textfield principal
  placeholderInputSecondary = "", // Este es el placeholder  que se muestra en el textfield secundario
  sxInputMain = {},
  sxInputSecondary = {},
}) => {
  return (
    <Box display="flex" flexDirection="column">
      <InputLabel>{label}</InputLabel>
      <Box display="flex">
        <TextField
          disabled
          sx={{
            "& .MuiInputBase-input": {
              overflowX: "auto",
              whiteSpace: "nowrap",
            },
            ...sxInputMain,
          }}
          value={valueInputMain}
          placeholder={placeholderInputMain}
        />
        <TextField
          sx={{
            "& .MuiInputBase-input": {
              overflowX: "auto",
              whiteSpace: "nowrap",
            },
            ...sxInputSecondary,
          }}
          value={valueInputSecondary}
          disabled
          placeholder={placeholderInputSecondary}
        />
      </Box>
    </Box>
  )
}

export default CustomReadableHelperDetail

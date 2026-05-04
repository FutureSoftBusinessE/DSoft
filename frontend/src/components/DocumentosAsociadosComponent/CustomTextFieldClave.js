import React, { useState } from "react"
import { TextField, InputAdornment, IconButton } from "@mui/material"
import { Visibility, VisibilityOff } from "@mui/icons-material"

const CustomTextFieldClave = ({
  value = "",
  onChange,
  disabled = false,
  readOnly = false,
  label = "Clave",
  placeholder = "********",
  size = "small",
  variant = "outlined",
  fullWidth = true,
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const handleToggleVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <TextField
      fullWidth={fullWidth}
      size={size}
      label={label}
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      required={required}
      variant={variant}
      autoComplete="off"
      name="no-autofill"
      id="no-autofill"
      InputProps={{
        readOnly,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={handleToggleVisibility} edge="end" size="small" disabled={disabled}>
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      inputProps={{
        autoComplete: "off",
        autoCorrect: "off",
        autoCapitalize: "off",
        spellCheck: "false",
        "data-lpignore": "true",
        "data-form-type": "other",
        "data-1p-ignore": "true",
      }}
      {...props}
    />
  )
}

export default CustomTextFieldClave

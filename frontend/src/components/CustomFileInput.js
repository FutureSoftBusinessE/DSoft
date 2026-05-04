import { useRef } from "react"
import { TextField, InputAdornment, Button } from "@mui/material"

const CustomFileInput = ({
  label = "",
  value = "",
  onChange = () => {},
  error = false,
  helperText = "",
  accept = "*",
  fullWidth = true,
  disabled = false,
  size = "small",
}) => {
  const fileInputRef = useRef(null)

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file.webkitRelativePath || file.name)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: "none" }}
        disabled={disabled}
      />
      <TextField
        size={size}
        fullWidth={fullWidth}
        label={label}
        value={value}
        error={error}
        helperText={helperText}
        disabled={disabled}
        readOnly
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Button
                size="small"
                variant="outlined"
                onClick={handleClick}
                disabled={disabled}
                sx={{
                  textTransform: "none",
                  fontSize: "0.875rem",
                  mr: 0.5,
                }}
              >
                Seleccionar
              </Button>
            </InputAdornment>
          ),
        }}
      />
    </>
  )
}

export default CustomFileInput

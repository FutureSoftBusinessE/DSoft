import { InputLabel, TextField, Box } from "@mui/material"

const CustomTextField = ({ label = "", value = "", setValue, onFocusBool = false, sxInput = {}, ...props }) => {
  const handleChange = (event) => {
    setValue(event.target.value)
    console.log(value)
  }

  return (
    <Box display="flex" flexDirection="column">
      <InputLabel>{label}</InputLabel>
      <TextField
        sx={{ ...sxInput }}
        value={value}
        onChange={handleChange}
        onFocus={onFocusBool ? (e) => e.target.select() : undefined}
        {...props}
      />
    </Box>
  )
}

export default CustomTextField

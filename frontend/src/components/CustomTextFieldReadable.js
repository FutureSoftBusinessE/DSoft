import { InputLabel, TextField, Box } from "@mui/material"

const CustomTextFieldReadable = ({ label = "", value = "", sxInput = {}, ...props }) => {
  return (
    <Box display="flex" flexDirection="column">
      <InputLabel>{label}</InputLabel>
      <TextField sx={{ ...sxInput }} value={value} disabled {...props} />
    </Box>
  )
}

export default CustomTextFieldReadable

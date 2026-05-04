import { InputLabel, Box } from "@mui/material"
import { TimePicker } from "@mui/x-date-pickers/TimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"

const CustomTimePicker = ({ label = "", value, setValue, sxInput = {}, ...props }) => {
  const handleChange = (newValue) => {
    if (newValue) {
      setValue(newValue)
    }
  }

  return (
    <Box display="flex" flexDirection="column">
      <InputLabel>{label}</InputLabel>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <TimePicker sx={{ ...sxInput }} value={value} onChange={handleChange} {...props} />
      </LocalizationProvider>
    </Box>
  )
}

export default CustomTimePicker

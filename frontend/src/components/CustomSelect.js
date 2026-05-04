import { InputLabel, FormControl, Select, MenuItem, Box, IconButton } from "@mui/material"
import { styled } from "@mui/system"
import ClearIcon from "@mui/icons-material/Clear"

const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}))

const CustomSelect = ({
  label,
  selectedOption = {},
  setSelectedOption,
  options = [],
  formControlProps = {},
  ...props
}) => {
  // Función para manejar el cambio de selección
  const handleChange = (event) => {
    const selectedValue = event.target.value
    const selectedObj = options.find((option) => option.value === selectedValue) || {} // Permitir valor vacío
    setSelectedOption(selectedObj) // Guardar el objeto completo de la opción seleccionada
  }

  // Función para limpiar la selección
  const handleClear = () => {
    setSelectedOption({}) // Resetear la opción seleccionada
  }

  return (
    <StyledBox>
      <InputLabel>{label}</InputLabel>
      <FormControl {...formControlProps}>
        <Select
          value={selectedOption?.value || ""} // Asegurar que el valor sea compatible con Select
          onChange={handleChange}
          displayEmpty
          endAdornment={
            selectedOption?.value && (
              <div style={{ position: "absolute", right: 20 }}>
                <IconButton size="small" onClick={handleClear}>
                  <ClearIcon />
                </IconButton>
              </div>
            )
          }
          {...props}
        >
          {options.map((option, index) => (
            <MenuItem key={index} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </StyledBox>
  )
}

export default CustomSelect

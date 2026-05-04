import React from "react"
import PropTypes from "prop-types"
import { styled } from "@mui/system"
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Box, InputLabel } from "@mui/material"

const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}))

const CustomRadioButtonGroup = ({
  label = "",
  selectedOption = null,
  setSelectedOption = () => {},
  options = [],
  rowView = false,
  boxStyle = {},
  ...props
}) => {
  // Obtener el valor para el RadioGroup
  const radioValue = selectedOption?.value || ""

  // Manejar cambio buscando el objeto completo
  const handleChange = (event) => {
    const selectedValue = event.target.value
    const fullOption = options.find((opt) => opt.value === selectedValue) || null
    setSelectedOption(fullOption)
  }

  return (
    <StyledBox style={{ textAlign: "center", ...boxStyle }}>
      <InputLabel style={{ marginBottom: "10px" }}>{label}</InputLabel>
      <FormControl component="fieldset" fullWidth>
        <RadioGroup
          row={rowView}
          sx={{ justifyContent: "center", gap: 1, alignContent: "center" }}
          value={radioValue}
          onChange={handleChange}
          {...props}
        >
          {options.map((option) => (
            <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
          ))}
        </RadioGroup>
      </FormControl>
    </StyledBox>
  )
}

// PropTypes actualizados
CustomRadioButtonGroup.propTypes = {
  label: PropTypes.string.isRequired,
  selectedOption: PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
  }),
  setSelectedOption: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
    }),
  ).isRequired,
  row: PropTypes.bool,
  sx: PropTypes.object,
}

export default CustomRadioButtonGroup

import * as React from "react"
import { styled } from "@mui/system"
import { InputLabel, Checkbox, Select, MenuItem, Box, ListItemText } from "@mui/material"

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
}
const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}))

export default function CustomMultiSelectCheckmark({
  label = "",
  selectedOptions = [],
  setSelectedOptions,
  options = [],
}) {
  const handleChange = (event) => {
    const {
      target: { value },
    } = event
    setSelectedOptions(
      // En autofill obtenemos un valor stringificado.
      typeof value === "string" ? value.split(",") : value,
    )
  }
  return (
    <div>
      <StyledBox>
        <InputLabel>{label}</InputLabel>
        <Select
          labelId="demo-multiple-checkbox-label"
          id="demo-multiple-checkbox"
          multiple
          value={selectedOptions}
          onChange={handleChange}
          renderValue={(selected) =>
            selected.map((value) => options.find((option) => option.value === value)?.label).join(", ")
          }
          MenuProps={MenuProps}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox checked={selectedOptions.includes(option.value)} />
              <ListItemText primary={option.label} />
            </MenuItem>
          ))}
        </Select>
      </StyledBox>
    </div>
  )
}

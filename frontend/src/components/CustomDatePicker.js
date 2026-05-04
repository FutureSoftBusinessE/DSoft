import * as React from "react"
import { DemoContainer } from "@mui/x-date-pickers/internals/demo"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import TextField from "@mui/material/TextField"
import Stack from "@mui/material/Stack"
import Checkbox from "@mui/material/Checkbox"
import InputAdornment from "@mui/material/InputAdornment"
import { ThemeProvider, createTheme, useTheme, InputLabel } from "@mui/material"
import { esES } from "@mui/material/locale"

const mergeAdornments = (...adornments) => {
  const nonNullAdornments = adornments.filter((el) => el != null)
  if (nonNullAdornments.length === 0) {
    return null
  }

  if (nonNullAdornments.length === 1) {
    return nonNullAdornments[0]
  }

  return (
    <Stack direction="row">
      {nonNullAdornments.map((adornment, index) => (
        <React.Fragment key={index}>{adornment}</React.Fragment>
      ))}
    </Stack>
  )
}

const PickerTextField = ({ onCheckboxChange, isDisabled, ...rest }) => (
  <TextField
    {...rest}
    onClick={(e) => {
      if (isDisabled) {
        e.stopPropagation()
      }
    }}
    InputProps={{
      ...rest.InputProps,
      endAdornment: mergeAdornments(
        <InputAdornment position="end">
          <Checkbox
            checked={!isDisabled}
            onChange={(e) => {
              e.stopPropagation()
              onCheckboxChange()
            }}
            size="small"
          />
        </InputAdornment>,
        rest.InputProps?.endAdornment ?? null,
      ),
    }}
    disabled={isDisabled}
  />
)

export default function CustomDatePicker({
  label = "",
  value,
  defaultValue = null,
  setValue,
  isOptional = false,
  checkboxInitialChecked = true,
  ...params
}) {
  const theme = useTheme()
  const [isDisabled, setIsDisabled] = React.useState(isOptional ? !checkboxInitialChecked : false)

  // 1. Usar un estado interno para el valor temporal
  const [internalValue, setInternalValue] = React.useState(value)

  // 2. Sincronizar el valor interno cuando cambia el valor del padre
  React.useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleCheckboxChange = () => {
    const newDisabledState = !isDisabled
    setIsDisabled(newDisabledState)

    if (newDisabledState) {
      setValue(null)
      setInternalValue(null) // Limpiar valor interno
    } else {
      // 3. Usar defaultValue inmediatamente
      const newValue = defaultValue !== null ? defaultValue : internalValue
      setValue(newValue)
      setInternalValue(newValue)
    }
  }

  const datePickerProps = {
    disabled: isDisabled,
    ...params,
  }

  const checkboxProps = isOptional
    ? {
        slotProps: {
          textField: {
            onCheckboxChange: handleCheckboxChange,
            isDisabled,
            fullWidth: true,
          },
        },
        slots: {
          textField: PickerTextField,
        },
      }
    : {}

  return (
    <ThemeProvider theme={createTheme(theme, esES)}>
      <InputLabel>{label}</InputLabel>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <DemoContainer components={["DatePicker"]} sx={{ paddingTop: 0 }}>
          {/* 4. Usar internalValue en lugar de value directamente */}
          <DatePicker
            value={isDisabled ? null : internalValue}
            onChange={(newValue) => {
              if (!isDisabled) {
                setValue(newValue)
                setInternalValue(newValue)
              }
            }}
            {...checkboxProps}
            {...datePickerProps}
          />
        </DemoContainer>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

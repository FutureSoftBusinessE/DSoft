import * as React from "react"
import PropTypes from "prop-types"
import TextField from "@mui/material/TextField"
import { Box, InputLabel } from "@mui/material"
import Autocomplete, { autocompleteClasses } from "@mui/material/Autocomplete"
import Popper from "@mui/material/Popper"
import { styled, createTheme, useTheme, ThemeProvider } from "@mui/material/styles"
import { VariableSizeList } from "react-window"
import Typography from "@mui/material/Typography"
import { esES } from "@mui/material/locale"

const LISTBOX_PADDING = 8 // px

function renderRow(props) {
  const { data, index, style } = props
  const dataSet = data[index]
  const inlineStyle = {
    ...style,
    top: style.top + LISTBOX_PADDING,
  }

  return (
    <Typography key={dataSet.value} component="li" noWrap style={inlineStyle}>
      {dataSet.label}
    </Typography>
  )
}

const OuterElementContext = React.createContext({})

const OuterElementType = React.forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext)
  return <div ref={ref} {...props} {...outerProps} />
})

function useResetCache(data) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true)
    }
  }, [data])
  return ref
}

// Adaptador para react-window
const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
  const { children, ...other } = props
  const itemData = React.Children.toArray(children)

  const itemCount = itemData.length
  const itemSize = 36

  const getChildSize = () => itemSize

  const getHeight = () => (itemCount > 8 ? 8 * itemSize : itemData.length * itemSize)

  const gridRef = useResetCache(itemCount)

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width="100%"
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={getChildSize}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  )
})

ListboxComponent.propTypes = {
  children: PropTypes.node,
}

const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: "border-box",
    "& ul": {
      padding: 0,
      margin: 0,
    },
  },
})

function CustomAutocomplete({ label, selectedOption, setSelectedOption, options, ...props }) {
  const theme = useTheme()
  console.log("options", options)
  return (
    <ThemeProvider theme={createTheme(theme, esES)}>
      <Box display="flex" flexDirection="column">
        <InputLabel>{label}</InputLabel>
        <Autocomplete
          {...props}
          disableListWrap
          options={options}
          value={selectedOption || null} // Maneja null como valor inicial
          onChange={(_, newValue) => setSelectedOption(newValue)} // Actualización del estado
          // getOptionLabel={(option) => (option ? option.label : "")} // Muestra una cadena vacía si no hay opción
          isOptionEqualToValue={(option, value) => option.value === value?.value} // Comprueba la igualdad de las opciones
          renderInput={(params) => <TextField {...params} />}
          renderOption={(props, option) => (
            <li {...props} key={option.value}>
              {option.label}
            </li>
          )}
          slots={{
            popper: StyledPopper,
            listbox: ListboxComponent,
          }}
        />
      </Box>
    </ThemeProvider>
  )
}

CustomAutocomplete.propTypes = {
  label: PropTypes.string,
  selectedOption: PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
  }),
  setSelectedOption: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
}

export default CustomAutocomplete

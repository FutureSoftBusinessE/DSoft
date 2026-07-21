import { TextField, IconButton, Tooltip, CircularProgress, InputAdornment } from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"

const RucSearchField = ({ value, onChange, readOnly = false, error, isSearching = false, onSearch }) => {
  const handleRucChange = (e) => {
    const newValue = e.target.value.replace(/\D/g, "").substring(0, 13)
    onChange("ciaruc", newValue)
  }

  const handleSearchClick = () => {
    if (onSearch && value && value.length === 13) {
      onSearch(value)
    }
  }

  return (
    <TextField
      size="small"
      fullWidth
      label="R.U.C."
      name="ciaruc"
      value={value || ""}
      onChange={handleRucChange}
      disabled={readOnly}
      error={Boolean(error)}
      helperText={error || " "}
      InputLabelProps={{ shrink: true }}
      onKeyPress={(e) => {
        if (e.key === "Enter") {
          handleSearchClick()
        }
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title="Buscar en SRI y autocompletar datos">
              <span>
                <IconButton
                  onClick={handleSearchClick}
                  disabled={readOnly || isSearching || !value || value.length !== 13}
                  color="primary"
                  size="small"
                  edge="end"
                >
                  {isSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </InputAdornment>
        ),
      }}
    />
  )
}

export default RucSearchField

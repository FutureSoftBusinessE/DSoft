import React from "react"
import Tooltip from "@mui/material/Tooltip"

const CustomTooltip = ({ title, children }) => {
  return (
    <Tooltip
      title={<span style={{ fontSize: "16px" }}>{title}</span>}
      sx={{
        tooltip: {
          fontSize: "16px",
        },
      }}
    >
      {children}
    </Tooltip>
  )
}

export default CustomTooltip

import React from "react"
import { Paper, Box, IconButton, Collapse, Typography } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"

const CustomFieldsetAccordion = ({
  title,
  children,
  sx,
  expanded,
  onToggle,
  titleColor = "primary.main",
  borderColor = "primary.light",
  headerBgColor = "background.paper",
  contentPadding = { xs: 2, sm: 3, md: 4 },
}) => {
  return (
    <Box
      sx={{
        position: "relative",
        display: "block",
        width: "100%",
        margin: "16px auto",
        transition: "all 0.3s ease",
        ...sx,
      }}
    >
      {/* Borde personalizado del fieldset */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: `2px solid ${borderColor}`,
          borderRadius: "8px",
          pointerEvents: "none",
          opacity: 0.6,
        }}
      />

      {/* Título del Fieldset con botón de expandir/contraer */}
      <Box
        onClick={onToggle}
        sx={{
          position: "absolute",
          top: -12,
          left: { xs: "50%", sm: 16 },
          transform: { xs: "translateX(-50%)", sm: "translateX(0)" },
          bgcolor: headerBgColor,
          px: 2,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "center", sm: "flex-start" },
          zIndex: 2,
          cursor: "pointer",
          borderRadius: "4px",
          boxShadow: "0 0 8px rgba(0,0,0,0.1)",
          transition: "all 0.2s ease",
          maxWidth: { xs: "calc(100% - 32px)", sm: "auto" },
          "&:hover": {
            boxShadow: "0 0 12px rgba(0,0,0,0.15)",
            transform: {
              xs: "translateX(-50%) translateY(-1px)",
              sm: "translateY(-1px)",
            },
          },
        }}
      >
        <Typography
          variant="subtitle1"
          component="div"
          sx={{
            fontWeight: 600,
            color: titleColor,
            fontSize: { xs: "16px", sm: "18px", md: "19px" },
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>
        <IconButton
          size="small"
          sx={{
            ml: 1,
            p: 0,
            color: titleColor,
            flexShrink: 0,
          }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Contenedor Paper con el Fieldset */}
      <Paper
        elevation={2}
        sx={{
          p: contentPadding,
          pt: { xs: 3, sm: 4 },
          mt: 1.5,
          borderRadius: "8px",
          backgroundColor: "background.default",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: expanded ? "0 6px 16px rgba(0,0,0,0.1)" : "0 4px 8px rgba(0,0,0,0.07)",
          },
        }}
      >
        <Collapse
          in={expanded}
          timeout={300}
          sx={{
            transition: "all 0.3s ease-in-out",
          }}
        >
          <Box sx={{ pt: 0.5 }}>{children}</Box>
        </Collapse>
      </Paper>
    </Box>
  )
}

export default CustomFieldsetAccordion

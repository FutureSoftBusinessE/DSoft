import React from "react"
import { Box, IconButton, Tooltip } from "@mui/material"
import { styled } from "@mui/material/styles"
import WhatsAppIcon from "@mui/icons-material/WhatsApp"
import YouTubeIcon from "@mui/icons-material/YouTube"

// =========================================================
// Redes sociales (edita aquí si cambian los links)
// =========================================================
const SOCIAL_LINKS = [
  {
    key: "whatsapp",
    label: "Contáctanos",
    href: "https://wa.me/593987454518",
    Icon: WhatsAppIcon,
    color: "#25D366",
  },
  {
    key: "youtube",
    label: "Tutoriales",
    href: "https://www.youtube.com/@Designfact-cd8md",
    Icon: YouTubeIcon,
    color: "#FF0000",
  },
]

const StyledWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}))

const StyledIconButton = styled(IconButton)(({ theme, ownerColor }) => ({
  color: ownerColor,
  transition: "transform 0.2s ease, opacity 0.2s ease",
  "&:hover": {
    transform: "scale(1.15)",
    opacity: 0.85,
    backgroundColor: "transparent",
  },
}))

const SocialMediaLinks = ({ links = SOCIAL_LINKS, iconSize = 40, sx }) => {
  if (!links?.length) return null

  return (
    <StyledWrapper sx={sx}>
      {links.map(({ key, label, href, Icon, color }) => (
        <Tooltip title={label} key={key} arrow>
          <StyledIconButton
            component="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            ownerColor={color}
          >
            <Icon sx={{ fontSize: iconSize }} />
          </StyledIconButton>
        </Tooltip>
      ))}
    </StyledWrapper>
  )
}

export default SocialMediaLinks

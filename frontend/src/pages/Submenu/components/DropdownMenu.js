import React, { useState } from "react"
import { Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, Button } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { NavLink } from "react-router-dom"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import * as Icons from "react-icons/im"

const StyledButton = styled(Button)(({ theme }) => ({
  width: "100%",
  minHeight: "48px",
  padding: "0px 16px",
  display: "flex",
  backgroundColor: "#fff",
  justifyContent: "flex-start",
  fontSize: "0.875rem",
  textTransform: "capitalize",
  color: "rgba(0, 0, 0, 0.87)",
  boxShadow: "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)",
}))

const DropdownMenu = ({ title, items, onClick, imageIcon }) => {
  const [expanded, setExpanded] = useState(true)

  const handleAccordionChange = () => {
    setExpanded(!expanded)
  }
  console.log(items, "itemssssss")

  const handleRounting = (e) => {
    console.log(e.target, "targettttt")

    const fullRoute = JSON.parse(localStorage.getItem("fullRoute"))
    console.log(fullRoute)
    if (fullRoute) {
      console.log(e.target, "targettttt")
      fullRoute.lastParam = e.target.innerText
      console.log(fullRoute)
      localStorage.setItem("fullRoute", JSON.stringify(fullRoute))
    }
  }

  const IconoConvertido = React.createElement(Icons[imageIcon], { size: 20 })

  return (
    <>
      {items ? (
        <Accordion expanded={expanded} onChange={handleAccordionChange} onClick={onClick}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <span>{title}</span>
          </AccordionSummary>
          <AccordionDetails>
            {items && items.length !== 0 && (
              <List>
                {items.map((item, index) => (
                  <ListItem key={index}>
                    <div style={{ marginRight: "15px" }}>{IconoConvertido}</div>
                    <NavLink to={`/home/dashboard${item.opcmenu}`} onClick={handleRounting}>
                      {item.opccaption}
                    </NavLink>
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>
      ) : (
        <StyledButton onClick={onClick}>{title}</StyledButton>
      )}
    </>
  )
}

export default DropdownMenu

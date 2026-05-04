import React, { useState, useEffect, useContext } from "react"
import { Container, Grid, Card, CardContent, Typography, Divider, List, ListItem, ListItemText } from "@mui/material"
import { useParams, useNavigate, NavLink } from "react-router-dom"
import * as Icons from "react-icons/fc"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import BackIcon from "../../components/BackIcon"
import { Icon } from "@iconify/react"
import getIconComponent from "../../helpers/getIconComponentMenu"
import { GlobalContext } from "../../contexts/GlobalContext"

// STYLES
const StyledLink = styled("span")(({ theme }) => ({
  margin: theme.spacing(1, 2),
  "&:hover": {
    textDecoration: "underline",
  },
}))

const StyledCard = styled(Card)(({ theme }) => ({
  boxSizing: "border-box",
  background: "transparent",
  boxShadow: "none",
  "& hr": {
    borderColor: "rgba(0, 0, 0, 0.99)",
  },
}))

const Submenu = () => {
  const { id, label } = useParams()
  const [submenu, setSubmenu] = useState([])

  useEffect(() => {
    const allMenu = JSON.parse(localStorage.getItem("menu"))?.menu
    if (!allMenu) return

    const currentMenuSelected = allMenu.find((menu) => menu?.item_number === id && menu?.label === label)
    if (!currentMenuSelected) return

    setSubmenu(currentMenuSelected.submenu)
  }, [id, label])

  return (
    <div className="main main-app p-3 p-lg-4">
      <BackIcon />
      <Container maxWidth="lg">
        <Grid
          container
          spacing={2}
          style={{
            marginTop: "5px",
            justifyContent: "center",
            columnGap: "15px",
          }}
        >
          {submenu.map((card) => {
            // const icon = React.createElement(Icons[card?.icon], { size: 30 })
            return (
              <Grid item key={card?.item_number} xs={12} sm={6} md={4} lg={3}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" align="center" style={{ margin: "15px 10px" }}>
                      {getIconComponent(card)}
                      {card.submenu ? (
                        card?.label
                      ) : (
                        <StyledLink style={{ display: "inline" }}>
                          <NavLink to={"/home/" + card?.link}>{card?.label}</NavLink>
                        </StyledLink>
                      )}
                    </Typography>
                    {card?.submenu && <Divider />}
                    {card?.submenu?.map((option) => {
                      return (
                        <>
                          <List>
                            <ListItem key={option?.item_number}>
                              {getIconComponent(option)}
                              <StyledLink>
                                <NavLink to={"/home/" + option?.link}>
                                  <ListItemText primary={option?.label} />
                                </NavLink>
                              </StyledLink>
                            </ListItem>
                          </List>
                        </>
                      )
                    })}
                  </CardContent>
                </StyledCard>
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </div>
  )
}

export default Submenu

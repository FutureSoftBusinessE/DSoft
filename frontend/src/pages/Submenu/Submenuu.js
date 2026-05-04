/* eslint-disable camelcase */
import React, { useState, useEffect } from "react"
import { Container, Grid, Typography } from "@mui/material"
import DropdownMenu from "./components/DropdownMenu"
import { useParams, useNavigate } from "react-router-dom"
import fetchwrapper from "../../services/interceptors/fetchwrapper"

const App = () => {
  const navigate = useNavigate()
  const [menus, setMenus] = useState([])
  const [selectedMenu, setSelectedMenu] = useState([])
  const { id, label } = useParams()
  const [currentIdMenu, setCurrentIdMenu] = useState(id)
  const [currentLabelMenu, setCurrentLabelMenu] = useState(label)
  const [fullRoute, setFullRoute] = useState([label])

  useEffect(() => {
    if (id !== currentIdMenu) {
      setCurrentIdMenu(id)
      // Aquí puedes agregar el código que quieres ejecutar cuando hay un cambio de ID en la ruta
    }
    if (label !== currentLabelMenu) {
      setCurrentLabelMenu(label)
      setFullRoute([label])
      // Aquí puedes agregar el código que quieres ejecutar cuando hay un cambio de label en la ruta
    }
  }, [id, label])

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const request = {
          item_number: currentIdMenu,
        }

        const accessToken = localStorage.getItem("accessToken")

        const options = {
          method: "POST",
          body: JSON.stringify(request),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
        console.log(request)
        const response = await fetchwrapper("/menu/get_menu_by_parent", options)

        if (!response.ok) {
          console.log(response)
          throw new Error(response)
        }

        const data = await response.json()
        console.log(data)
        setMenus(data)
      } catch (err) {
        console.error("error", err)
        console.error(err)
      }
    }
    fetchMenus()
  }, [currentIdMenu])

  const handleMenuClick = async (id, title) => {
    console.log("idd", id)
    try {
      const request = {
        item_number: id,
      }
      const accessToken = localStorage.getItem("accessToken")

      const options = {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
      console.log(request)
      const response = await fetchwrapper("/menu/get_menu_by_parent", options)
      if (!response.ok) {
        throw new Error(response)
      }
      const data = await response.json()

      if (JSON.stringify(data) !== JSON.stringify(selectedMenu)) {
        setFullRoute((prev) => {
          localStorage.setItem(
            "fullRoute",
            JSON.stringify({
              base: [prev[0], title],
              lastParam: "",
            }),
          )

          return [prev[0], title]
        })
      }

      if (data.length === 0) {
        localStorage.setItem(
          "fullRoute",
          JSON.stringify({
            base: [...fullRoute],
            lastParam: title,
          }),
        )
        navigate(`/home/dashboard/${title}`)
        setSelectedMenu(data)
      }

      setSelectedMenu(data)
    } catch (err) {
      console.error("error", err)
    }
  }

  return (
    <div className="main main-app p-3 p-lg-4">
      <Container maxWidth="lg">
        <Typography variant="h7" align="center" gutterBottom>
          {fullRoute.join(" > ")}
        </Typography>
        <Grid container spacing={2} style={{ marginTop: "5px" }}>
          {menus.map((menu, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <DropdownMenu
                imageIcon={selectedMenu[0]?.opcicono}
                title={menu.opccaption}
                items={selectedMenu[0]?.padre_id === menu.item_number ? selectedMenu : null}
                onClick={() => handleMenuClick(menu.item_number, menu.opccaption)}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </div>
  )
}

export default App

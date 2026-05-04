import { Typography } from "@mui/material"
import { useEffect, useState } from "react"

const FullRoute = () => {
  const [fullRoute, setFullRoute] = useState([])
  useEffect(() => {
    let route = JSON.parse(localStorage.getItem("fullRoute"))
    route = [...route.base, route.lastParam]
    console.log(route)
    setFullRoute(route)
  }, [])

  return (
    <Typography variant="h7" align="center" gutterBottom>
      {fullRoute.join(" > ")}
    </Typography>
  )
}

export default FullRoute

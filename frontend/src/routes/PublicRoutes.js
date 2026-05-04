// eslint-disable-next-line no-unused-vars
import React from "react"
import NotFound from "../pages/NotFound"

import { Login, LoginInner } from "../pages"

const publicRoutes = [
  { path: "login", element: <Login /> },
  { path: "loginInner", element: <LoginInner /> },
  { path: "pages/error-404", element: <NotFound /> },
]

export default publicRoutes

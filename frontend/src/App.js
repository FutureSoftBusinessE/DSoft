import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Main from "./layouts/Main"
import NotFound from "./pages/NotFound"

import publicRoutes from "./routes/PublicRoutes"
import protectedRoutes from "./routes/ProtectedRoutes"
import { ProtectedRoutes } from "./pages"
// import css
import "./assets/css/remixicon.css"

// import scss
import "./scss/style.scss"

import { GlobalContextProvider } from "./contexts/GlobalContext"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

// Put this with your other react-query providers near root of your app
const queryClient = new QueryClient()

// set skin on load
window.addEventListener("load", function () {
  const skinMode = localStorage.getItem("skin-mode")
  const HTMLTag = document.querySelector("html")

  if (skinMode) {
    HTMLTag.setAttribute("data-skin", skinMode)
  }
})

export default function App() {
  return (
    <React.Fragment>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/" element={<Navigate to="/loginInner" />} />

            <Route element={<ProtectedRoutes />}>
              <Route
                path="/home"
                element={
                  <GlobalContextProvider>
                    <Main />
                  </GlobalContextProvider>
                }
              >
                {protectedRoutes.map((route, index) => {
                  return <Route path={route.path} element={route.element} key={index} />
                })}
              </Route>
            </Route>
            {publicRoutes.map((route, index) => {
              return <Route path={route.path} element={route.element} key={index} />
            })}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={true} />
      </QueryClientProvider>
    </React.Fragment>
  )
}

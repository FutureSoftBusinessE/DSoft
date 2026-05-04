/* eslint-disable no-unused-vars */
import React from "react"
import "../styles/RootBoundary.css"

const RootBoundary = () => {
  const goBack = () => {
    window.location.href = "/"
  }

  return (
    <div className="error-page">
      <h1>¡Ups, algo salió mal!</h1>
      <p>Lo sentimos, parece que ha ocurrido un error.</p>
      <button className="back-button" onClick={goBack}>
        Volver
      </button>
    </div>
  )
}

export default RootBoundary

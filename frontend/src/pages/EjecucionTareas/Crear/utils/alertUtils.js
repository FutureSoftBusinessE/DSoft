import Swal from "sweetalert2"

const defaultZIndex = 9999 // Valor para z-index más alto

export const showSuccess = (message, title = "¡Éxito!") => {
  return Swal.fire({
    title,
    text: message,
    icon: "success",
    confirmButtonText: "Aceptar",
    customClass: {
      container: "swal-popup", // Si quieres personalizar más en CSS
    },
    didOpen: () => {
      const swalPopup = document.querySelector(".swal-popup")
      if (swalPopup) swalPopup.style.zIndex = defaultZIndex
    },
  })
}

export const showError = (message, title = "Error") => {
  return Swal.fire({
    title,
    text: message,
    icon: "error",
    confirmButtonText: "Aceptar",
    customClass: {
      container: "swal-popup",
    },
    didOpen: () => {
      const swalPopup = document.querySelector(".swal-popup")
      if (swalPopup) swalPopup.style.zIndex = defaultZIndex
    },
  })
}

export const showWarning = (message, title = "Advertencia") => {
  return Swal.fire({
    title,
    text: message,
    icon: "warning",
    confirmButtonText: "Entendido",
    customClass: {
      container: "swal-popup",
    },
    didOpen: () => {
      const swalPopup = document.querySelector(".swal-popup")
      if (swalPopup) swalPopup.style.zIndex = defaultZIndex
    },
  })
}

export const showConfirmation = (message, title = "¿Estás seguro?") => {
  return Swal.fire({
    title,
    text: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
    customClass: {
      container: "swal-popup",
    },
    didOpen: () => {
      const swalPopup = document.querySelector(".swal-popup")
      if (swalPopup) swalPopup.style.zIndex = defaultZIndex
    },
  })
}

export const showServerError = (error, defaultMessage = "Error del servidor") => {
  const message = error?.response?.data?.message || error?.message || defaultMessage || error?.details?.message
  return showError(message, "Error del Servidor")
}

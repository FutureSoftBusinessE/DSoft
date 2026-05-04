function fetchwrapper(url, options) {
  const API_URL = process.env.REACT_APP_API_URL
  const token = localStorage.getItem("accessToken")
  if (token) {
    if (!options) {
      options = {}
    }
    if (!options.headers) {
      options.headers = {}
    }
    options.headers.Authorization = `Bearer ${JSON.parse(token)}`
  }
  return fetch(API_URL + url, options).then(async (response) => {
    if (!response.ok) {
      // Si el backend not trae un objeto con clave error entonces solo mandara un error general
      // Si el código de estado no está en el rango 200-299
      let finalErrorReturned = new Error(`HTTP error! Status: ${response.status}`)
      try {
        // Si el backend trae un objeto con clave error entonces tendre info detallada del error
        const errorBody = await response.clone().json() // solo intenta JSON si existe
        if (errorBody?.error) {
          const errorObj = {
            details: errorBody.error,
          }
          finalErrorReturned = errorObj
        }
      } catch (error) {
        console.log(`Error interno de fetchwrapper: ${error}`)
      }
      throw finalErrorReturned
    }
    return response
  })
}
export default fetchwrapper

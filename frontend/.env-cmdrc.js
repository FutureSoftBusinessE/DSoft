module.exports = {
  development: {
    // Ambiente para desarrollo local
    REACT_APP_API_URL: "",
  },
  staging: {
    // Para crear una build para subirlo al server de desarrollo.
    REACT_APP_API_URL: "https://apidesignfactectest.futuresoft-ec.com/api",
  },
  // Para el build final de producción
  production: {
    REACT_APP_API_URL: "https://apidesignfactec.fsbsec.com/api",
  },
}

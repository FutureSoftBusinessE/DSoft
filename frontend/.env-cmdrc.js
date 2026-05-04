module.exports = {
  development: {
    // Ambiente para desarrollo local
    REACT_APP_API_URL: "http://127.0.0.1:5000",
  },
  staging: {
    // Para crear una build para subirlo al server de desarrollo.
    REACT_APP_API_URL: "https://fsoftapptest.futuresoft-ec.com:6050",
  },
  // Para el build final de producción
  production: {
    REACT_APP_API_URL: "https://siac.fsbsec.com:6050",
  },
}

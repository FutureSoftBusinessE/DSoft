class CustomError extends Error {
  // eslint-disable-next-line no-useless-constructor
  constructor(message) {
    super(message)
  }
}

export default CustomError

// Logica para tomar la cadena hexadecimal y llevarla Blob (Binary Large Object)
// Sirve para facilitar hacer que se pueda llevar facilmente a jpg.

export function hexToBase64(hex) {
  const raw = hex
    .match(/.{1,2}/g)
    .map((byte) => String.fromCharCode(parseInt(byte, 16)))
    .join("")
  return btoa(raw)
}

export function base64ToBlob(base64, type = "image/png") {
  const binary = atob(base64.replace(/\s/g, ""))
  const len = binary.length
  const buffer = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i)
  }
  return new Blob([buffer.buffer], { type })
}

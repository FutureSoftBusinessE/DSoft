// import React, { useState, useEffect, useCallback, useRef } from "react"
// import Webcam from "react-webcam"

// const ImagenTab = () => {
//   const [devices, setDevices] = useState([])
//   const [deviceId, setDeviceId] = useState("")
//   const webcamRef = useRef(null)

//   // Obtener dispositivos de video
//   const handleDevices = useCallback(
//     (mediaDevices) => setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
//     [setDevices],
//   )

//   useEffect(() => {
//     navigator.mediaDevices.enumerateDevices().then(handleDevices)
//   }, [handleDevices])

//   // Capturar foto
//   const capturePhoto = useCallback(() => {
//     const imageSrc = webcamRef.current.getScreenshot()
//     console.log(imageSrc) // Aquí puedes manejar la imagen capturada
//   }, [webcamRef])

//   return (
//     <div>
//       <h2>Seleccionar cámara</h2>
//       <select onChange={(e) => setDeviceId(e.target.value)} value={deviceId}>
//         {devices.map((device, index) => (
//           <option key={device.deviceId} value={device.deviceId}>
//             {device.label || `Cámara ${index + 1}`}
//           </option>
//         ))}
//       </select>

//       <Webcam
//         audio={false}
//         ref={webcamRef}
//         screenshotFormat="image/jpeg"
//         videoConstraints={{ deviceId: deviceId ? { exact: deviceId } : undefined }}
//       />

//       <button onClick={capturePhoto}>Capturar Foto</button>
//     </div>
//   )
// }

// export default ImagenTab

// import React, { useCallback, useRef, useMemo, useState } from "react"
// import Webcam from "react-webcam"
// import { Button } from "@mui/material"

// import { MaterialReactTable } from "material-react-table"

// const CameraCaptureComponent = ({ onCapture }) => {
//   const webcamRef = useRef(null)

//   // Función para capturar la foto
//   const capturePhoto = useCallback(() => {
//     const imageSrc = webcamRef.current.getScreenshot()
//     onCapture(imageSrc) // Devolver la imagen capturada
//   }, [webcamRef, onCapture])

//   return (
//     <div>
//       <h2>Captura de Imagen</h2>
//       <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width={720} height={480} />
//       <Button variant="contained" onClick={capturePhoto}>
//         Capturar Foto
//       </Button>
//     </div>
//   )
// }

// const ImageManagementComponent = () => {
//   // Estado que simula los datos traídos de la base de datos
//   const [imageData, setImageData] = useState([
//     { imageName: "Imagen 1", imageHex: "data:image/jpeg;base64,..." },
//     { imageName: "Imagen 2", imageHex: "data:image/jpeg;base64,..." },
//   ])

//   const [selectedRows, setSelectedRows] = useState([]) // Guardar las filas seleccionadas
//   const [isCameraOpen, setIsCameraOpen] = useState(false) // Controlar si la cámara está abierta
//   const [editMode, setEditMode] = useState(false) // Controlar si estamos en modo edición

//   // Definir las columnas para la tabla
//   const columns = useMemo(
//     () => [
//       {
//         accessorKey: "imageName",
//         header: "Nombre de la Imagen",
//       },
//       {
//         accessorKey: "imageHex",
//         header: "Imagen",
//         Cell: ({ cell }) => <img src={cell.getValue()} alt="Imagen" style={{ width: 100, height: 100 }} />,
//       },
//     ],
//     [],
//   )

//   // Función para abrir la cámara en modo agregar o editar
//   const handleAddOrEdit = (isEdit) => {
//     setEditMode(isEdit)
//     setIsCameraOpen(true)
//   }

//   // Capturar la imagen desde el componente CameraCaptureComponent
//   const handleCaptureImage = (imageHex) => {
//     if (editMode && selectedRows.length > 0) {
//       // Editar imagen seleccionada
//       const selectedRowIndex = selectedRows[0].index
//       const updatedImageData = [...imageData]
//       updatedImageData[selectedRowIndex].imageHex = imageHex
//       setImageData(updatedImageData)
//     } else {
//       // Agregar nueva imagen
//       setImageData([...imageData, { imageName: `Imagen ${imageData.length + 1}`, imageHex }])
//     }
//     setIsCameraOpen(false) // Cerrar la cámara
//   }

//   return (
//     <div>
//       <h1>Gestión de Imágenes</h1>

//       {/* Tabla con selección de filas */}
//       <MaterialReactTable
//         columns={columns}
//         data={imageData}
//         enableMultiRowSelection={false} // shows radio buttons instead of checkboxes
//         enableRowSelection={true}
//         onRowSelectionChange={setSelectedRows} // Actualizar las filas seleccionadas
//         state={{ rowSelection: selectedRows }}
//       />

//       {/* Botones de agregar y editar */}
//       <Button variant="contained" onClick={() => handleAddOrEdit(false)} style={{ marginTop: 10 }}>
//         Agregar Nueva Imagen
//       </Button>
//       <Button
//         variant="contained"
//         onClick={() => handleAddOrEdit(true)}
//         disabled={selectedRows.length === 0}
//         style={{ marginTop: 10, marginLeft: 10 }}
//       >
//         Editar Imagen Seleccionada
//       </Button>

//       {/* Componente de cámara para capturar imágenes */}
//       {isCameraOpen && <CameraCaptureComponent onCapture={handleCaptureImage} />}
//     </div>
//   )
// }

// export default ImageManagementComponent
// Función para convertir Base64 a hexadecimal
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import Webcam from "react-webcam"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Paper,
  Box,
  Typography,
  Alert,
} from "@mui/material"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { MRT_Localization_ES } from "material-react-table/locales/es"

// ------------------------------------------------------------------
// ------------------------------------------------------------------
//                         WebcamSelector
// ------------------------------------------------------------------
// ------------------------------------------------------------------

const WebcamSelector = ({ webcamRef }) => {
  const [devices, setDevices] = useState([]) // Lista de cámaras disponibles
  const [deviceId, setDeviceId] = useState("") // ID de la cámara seleccionada

  // Obtener dispositivos de video (cámaras)
  const handleDevices = useCallback(
    (mediaDevices) => setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices],
  )

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices)
  }, [handleDevices])

  // // Capturar foto desde la webcam
  // const capturePhoto = useCallback(() => {
  //   const imageSrc = webcamRef.current.getScreenshot()
  //   console.log(imageSrc) // Aquí puedes manejar la imagen capturada, por ejemplo, subirla a un servidor
  // }, [webcamRef])

  // Video constraints que intenta usar la cámara trasera por defecto si no se selecciona otra
  const videoConstraints = {
    facingMode: deviceId ? undefined : { ideal: "environment" }, // Usa la cámara trasera si no hay otra seleccionada
    deviceId: deviceId ? { exact: deviceId } : undefined, // Usa la cámara seleccionada si existe
    width: 400,
    height: 300,
    aspectRatio: 4 / 3,
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#333" }}>
          Seleccionar cámara
        </Typography>
        <select
          onChange={(e) => setDeviceId(e.target.value)}
          value={deviceId}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontFamily: "inherit",
            fontSize: "14px",
          }}
        >
          <option value="">-- Cámara por defecto --</option>
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Cámara ${index + 1}`}
            </option>
          ))}
        </select>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          borderRadius: "8px",
          overflow: "hidden",
          border: "2px solid #e0e0e0",
        }}
      >
        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} />
      </Box>
    </Box>
  )
}

// ------------------------------------------------------------------
// ------------------------------------------------------------------
//                        ImageManagementComponent
// ------------------------------------------------------------------
// ------------------------------------------------------------------

const ImageManagementComponent = ({ artcodigo, invcodigo }) => {
  const [data, setData] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const webcamRef = useRef(null)
  const [hasPermissionImageTab, setHasPermissionImageTab] = useState(false)
  const [isLoadingGetImgs, setIsLoadingGetImgs] = useState(false)
  const [isLoadingSaveImg, setIsLoadingSaveImg] = useState(false)

  const getAllImages = async () => {
    try {
      setIsLoadingGetImgs(true)
      const options = {
        method: "POST",
        body: JSON.stringify({
          artcodigo,
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      let response = await fetchwrapper("/productos/getListImages", options)
      response = await response.json()
      response = response.data
      setHasPermissionImageTab(response.hasPermission)
      setData(response.images)
    } catch (error) {
      alert("Error al cargar la galeria de imágenes")
    } finally {
      setIsLoadingGetImgs(false)
    }
  }

  useEffect(() => {
    getAllImages()
  }, [])

  const columns = useMemo(
    () => [
      { accessorKey: "artsecuen", header: "Secuencia", size: 80 },
      {
        accessorKey: "artimagen",
        header: "Imagen",
        Cell: ({ cell }) => (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <img
              src={`data:image/jpeg;base64,${cell.getValue()}`}
              alt="Imagen"
              style={{ width: 80, height: 80, borderRadius: "4px", objectFit: "cover" }}
            />
          </Box>
        ),
      },
    ],
    [],
  )

  const handleOpenCamera = () => {
    const selectedRowKey = Object.keys(rowSelection)[0]
    setEditingRow(selectedRowKey ? data[selectedRowKey] : null)
    setIsCameraOpen(true)
  }

  const deleteImage = async () => {
    const artsecuen = parseInt(Object.keys(rowSelection)[0])
    try {
      setIsLoadingSaveImg(true)
      const options = {
        method: "POST",
        body: JSON.stringify({
          artcodigo,
          invcodigo,
          artsecuen,
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      await fetchwrapper("/productos/deleteSpecificImage", options)
      await getAllImages()
    } catch (error) {
      alert("Error al eliminar la imágen")
    } finally {
      setIsLoadingSaveImg(false)
    }
  }

  const createNewImage = async (artimagen) => {
    try {
      setIsLoadingSaveImg(true)
      const options = {
        method: "POST",
        body: JSON.stringify({
          artcodigo,
          invcodigo,
          artimagen,
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
      await fetchwrapper("/productos/addNewImage", options)
      await getAllImages()
    } catch (error) {
      alert("Error al agregar una nueva imágen")
    } finally {
      setIsLoadingSaveImg(false)
    }
  }

  const editOldImage = async (artimagen, artsecuen) => {
    try {
      setIsLoadingSaveImg(true)
      const options = {
        method: "POST",
        body: JSON.stringify({
          artcodigo,
          invcodigo,
          artsecuen,
          artimagen,
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      await fetchwrapper("/productos/editSpecificImage", options)
      await getAllImages()
    } catch (error) {
      alert("Error al editar la imágen")
    } finally {
      setIsLoadingSaveImg(false)
      setIsCameraOpen(false)
      handleClearSelection()
    }
  }

  const handleCapture = async () => {
    const screenshot = webcamRef.current.getScreenshot()
    if (editingRow !== null) {
      // Editar imagen existente
      const artsecuen = parseInt(Object.keys(rowSelection)[0])
      editOldImage(screenshot, artsecuen)
    } else {
      await createNewImage(screenshot)
    }
    setIsCameraOpen(false)
    setRowSelection({})
  }
  // Usamos useMaterialReactTable para la lógica de la tabla
  const table = useMaterialReactTable({
    columns,
    data,
    getRowId: (row) => row.artsecuen,
    enableRowSelection: true,
    enableMultiRowSelection: false, // Se permite solo una fila seleccionada
    muiTableBodyRowProps: ({ row }) => ({
      onClick: row.getToggleSelectedHandler(),
      sx: { cursor: "pointer" },
    }),
    localization: { ...MRT_Localization_ES },
    enableTopToolbar: false,
    onRowSelectionChange: setRowSelection, // Manejar la selección de filas
    state: { rowSelection },
  })

  const handleClearSelection = () => {
    setRowSelection({})
  }

  return (
    <>
      <CustomBackdrop isLoading={isLoadingGetImgs || isLoadingSaveImg} zIndex={999999} />

      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          background: "white",
          mt: 3,
        }}
      >
        {hasPermissionImageTab ? (
          <Box>
            {/* Título */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: "#333",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Galería de Imágenes
            </Typography>

            {/* Mensajes informativos */}
            {data.length === 0 && !isLoadingGetImgs && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No hay imágenes registradas aún. Agrega una nueva imagen usando el botón "Agregar Nueva Imagen".
              </Alert>
            )}

            {/* Botones de acción */}
            <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap", gap: 1.5 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenCamera}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                }}
              >
                {Object.keys(rowSelection).length ? "Editar Imagen" : "Agregar Nueva Imagen"}
              </Button>

              {/* Mostrar botón "Eliminar" si hay algo seleccionado */}
              {Object.keys(rowSelection).length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={deleteImage}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                  }}
                >
                  Eliminar
                </Button>
              )}

              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearSelection}
                disabled={Object.keys(rowSelection).length === 0}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Limpiar selección
              </Button>
            </Stack>

            {/* Tabla */}
            <Box sx={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e0e0e0" }}>
              <MaterialReactTable table={table} />
            </Box>

            {/* Dialog para la cámara */}
            <Dialog open={isCameraOpen} onClose={() => setIsCameraOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ fontWeight: 700, backgroundColor: "#f5f7fa" }}>
                {editingRow ? "Editar Imagen" : "Capturar Nueva Imagen"}
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <WebcamSelector webcamRef={webcamRef} />
              </DialogContent>
              <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={() => setIsCameraOpen(false)} variant="outlined">
                  Cancelar
                </Button>
                <Button onClick={handleCapture} variant="contained" color="primary">
                  Capturar Imagen
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        ) : (
          <Alert severity="warning">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Acceso denegado
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              No tienes permiso para acceder a la galería de imágenes.
            </Typography>
          </Alert>
        )}
      </Paper>
    </>
  )
}

export default ImageManagementComponent

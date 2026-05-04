import React, { useState, useEffect } from "react"
import QRCodeScanner from "./QRCodeScanner"
import { Modal, Typography, Box } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"

const style = {
  position: "absolute",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
}

export default function ModalCameraQr({ isOpenModalQr, handleCloseModalQr, scannerParams, infoRead, setInfoRead }) {
  const handleScanSuccess = (decodedText, decodedResult) => {
    if (decodedText) {
      console.log(decodedText, decodedResult)
      setInfoRead((prev) => ({ ...prev, barcodeDataText: decodedText }))
    }
  }

  const handleScanFail = (err) => {
    console.error(err)
  }

  return (
    <Modal
      open={isOpenModalQr}
      onClose={handleCloseModalQr}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={style}>
        <CloseIcon onClick={handleCloseModalQr} style={{ cursor: "pointer" }} />
        <Typography id="modal-modal-title" variant="h6" component="h2" align="center" sx={{ mb: 2 }}>
          {scannerParams.msg}
        </Typography>
        <QRCodeScanner onScanSuccess={handleScanSuccess} onScannFail={handleScanFail} scannerParams={scannerParams} />
        <Typography id="modal-modal-description" variant="body1" component="p" align="center" sx={{ mt: 2 }}>
          {infoRead?.barcodeDataText}
        </Typography>
      </Box>
    </Modal>
  )
}

import React, { useEffect, useState } from "react"
import BarocdeReaderHoneywell from "../../pages/utils/honeywell/BarcodeReader"
import { Button } from "@mui/material"
import ModalCameraQr from "./ModalCameraQr"
import { styled } from "@mui/material/styles"
import ObturaradorIcon from "../../assets/iconos/Obturador.ico"

const StyledButtonsFiltro = styled(Button)(({ theme }) => ({
  margin: "auto",
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
}))

const Obturador = ({ scannerParams, executeFunction }) => {
  const [infoRead, setInfoRead] = useState({
    barcodeDataText: "",
    symbTypeText: "",
    readTimeText: "",
  })

  // When values is ready, execute an action
  useEffect(() => {
    if (infoRead.barcodeDataText || infoRead.symbTypeText || infoRead.readTimeText) {
      try {
        executeFunction(infoRead, handleCloseModalQr)
      } catch (error) {
        handleCloseModalQr()
        alert("No se puedo reconocer el dato scaneado")
      }
    }
  }, [infoRead])

  // ----------------HONEYWELL API--------------------------
  const myBarcodeReaderHW = new BarocdeReaderHoneywell(setInfoRead) // BarcodeHoneywwell

  // Try detect honeywell device
  useEffect(() => {
    myBarcodeReaderHW.setup()
  }, [])

  // Open honeywell barcodereader
  const openMyBarcodeReaderHW = () => {
    myBarcodeReaderHW.openReader()
  }

  // ----------------MODAL CAMERA API ---------------------

  const [isOpenModalQr, setIsOpenModalQr] = useState(false)

  const cleanTextScanner = () => {
    setInfoRead({
      barcodeDataText: "",
      symbTypeText: "",
      readTimeText: "",
    })
  }

  const handleOpenModalQr = () => {
    cleanTextScanner()
    setIsOpenModalQr(true)
  }

  const handleCloseModalQr = () => {
    setIsOpenModalQr(false)
  }

  return (
    <div>
      <Button
        variant="outlined"
        onClick={() => {
          handleOpenModalQr()
          openMyBarcodeReaderHW()
        }}
        color="secondary"
        className={StyledButtonsFiltro}
        sx={{ width: "250px" }}
        endIcon={<img src={ObturaradorIcon} style={{ width: "22px" }} alt="buscar" />}
      >
        Abrir obturador
      </Button>
      <ModalCameraQr
        isOpenModalQr={isOpenModalQr}
        handleCloseModalQr={handleCloseModalQr}
        scannerParams={scannerParams}
        infoRead={infoRead}
        setInfoRead={setInfoRead}
      />
    </div>
  )
}

export default Obturador

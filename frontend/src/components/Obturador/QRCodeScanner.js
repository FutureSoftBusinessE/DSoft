import React, { useEffect, useRef } from "react"
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from "html5-qrcode"

const qrcodeRegionId = "reader"

const QRCodeScanner = ({ onScanSuccess, onScannFail, scannerParams }) => {
  // Adapt size
  const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
    const minEdgePercentage = 0.9 // 70%
    const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
    const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)
    return {
      width: qrboxSize,
      height: qrboxSize,
    }
  }

  const barboxFunction = (viewfinderWidth, viewfinderHeight) => {
    const barboxWidth = viewfinderWidth * 0.9 // 90% del ancho del visor
    const barboxHeight = viewfinderHeight * 0.6 // 40% del alto del visor

    return {
      width: Math.floor(barboxWidth),
      height: Math.floor(barboxHeight),
    }
  }

  useEffect(() => {
    // when component mounts
    const config = {
      fps: 10,
      qrbox: scannerParams.codeType === "qrcode" ? qrboxFunction : barboxFunction,
      strings: {
        cameraPermission: "Custom Camera Permission Message",
        scanFromFile: "Custom Scan From File Message",
      },
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      aspectRatio: 1.333333,
      rememberLastUsedCamera: true,
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(qrcodeRegionId, config, false)

    const onSuccess = (decodedText, decodedResult) => {
      html5QrcodeScanner.clear()
      onScanSuccess(decodedText, decodedResult)
    }
    const onFail = (error) => {
      // onScannFail();
      console.warn(error)
    }

    html5QrcodeScanner.render(onSuccess, onFail)

    // cleanup function when component will unmount
    return () => {
      html5QrcodeScanner.clear()
    }
  }, [])

  return <div id={qrcodeRegionId} />
}

export default QRCodeScanner

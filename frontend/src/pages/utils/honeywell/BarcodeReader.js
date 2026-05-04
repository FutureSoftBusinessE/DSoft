class BarocdeReaderHoneywell {
  #barcodeDataText = ""
  #symbTypeText = ""
  #readTimeText = ""
  #readers = false
  #readerSelect = null
  //   const [r, setR] = null;
  #barcodeReader = false
  #readerAutoClosed = false

  constructor(cbSetStateInfoRead) {
    this.readers = this.#readers
    this.barcodeReader = this.#barcodeReader
    this.readerSelect = this.#readerSelect
    this.readerAutoClosed = this.#readerAutoClosed
    this.barcodeDataText = this.#barcodeDataText
    this.symbTypeText = this.#symbTypeText
    this.readTimeText = this.#readTimeText

    this.cbSetStateInfoRead = cbSetStateInfoRead
  }

  // Verify the symbology configuration
  onSetBufferedComplete = (result) => {
    if (result.status !== 0) {
      console.error("No se pudo decodificar ese código de barra")
    }
  }

  onCommitComplete = (resultArray) => {
    if (resultArray.length > 0) {
      for (let i = 0; i < resultArray.length; i++) {
        const result = resultArray[i]
        if (result.status !== 0) {
          console.log("commitBuffer failed")
          if (result.method === "getBuffered" || result.method === "setBuffered") {
            console.error("Buffer completed")
          }
        }
      } // endfor
    }
  }

  onBarcodeDataReady = (data, type, time) => {
    this.barcodeDataText = data
    this.symbTypeText = type
    this.readTimeText = time

    const infoRead = {
      barcodeDataText: data,
      symbTypeText: type,
      readTimeText: time,
    }

    this.cbSetStateInfoRead(infoRead)
  }

  addRemoveBarcodeListener = (added) => {
    if (added) {
      // Add an event handler for the barcodedataready event
      this.barcodeReader.addEventListener("barcodedataready", this.onBarcodeDataReady, false)
    } else {
      // Remove an event handler for the barcodedataready event
      this.barcodeReader.removeEventListener("barcodedataready", this.onBarcodeDataReady)
    }
  }

  onBeforeUnload = (e) => {
    const message = "Por favor cierre el lector de barras antes dejar esta página."
    ;(e || window.event).returnValue = message
    return message
  }

  onBarcodeReaderComplete = (result) => {
    if (result.status === 0) {
      // BarcodeReader object was successfully created
      // logMsgElement.innerHTML = "BarcodeReader object successfully created";

      // Configure the symbologies needed. Buffer the settings and commit them at once.
      this.barcodeReader.setBuffered("Symbology", "Code128", "EnableCode128", "true", this.onSetBufferedComplete)
      this.barcodeReader.setBuffered("Symbology", "EANUPC", "EnableEAN13", "true", this.onSetBufferedComplete)
      this.barcodeReader.setBuffered("Symbology", "Code128", "EnableGS1_128", "true", this.onSetBufferedComplete)
      this.barcodeReader.setBuffered("Symbology", "QRCode", "Enable", "true", this.onSetBufferedComplete)

      this.barcodeReader.commitBuffer(this.onCommitComplete)

      console.error("Obturador creado y abierto")

      // Add an event handler to receive barcode data
      this.addRemoveBarcodeListener(true)
      // Add an event handler for the window's beforeunload event
      window.addEventListener("beforeunload", this.onBeforeUnload)
    } else {
      this.barcodeReader = null
      console.error("No se puede detectar un lector de códigos")
    }
  }

  // Solo crea un nuevo barcode reader si no existe y si ya existe no hace nada
  openBarcodeReader = (scannerName) => {
    if (!this.barcodeReader) {
      this.barcodeReader = new window.BarcodeReader(scannerName, this.onBarcodeReaderComplete)
    }
  }

  /**
   * If the browser supports visibility change event, we can close the
   * BarcodeReader object when the web page is hidden and create a new
   * instance of the BarcodeReader object when the page is visible. This
   * logic is used to re-claim the barcode reader in case another
   * application has claimed it when this page becomes hidden.
   */
  handleVisibilityChange = () => {
    if (document[this.hidden]) {
      // The web page is hidden
      // closeBarcodeReader(true);
    } // The web page is visible
    else {
      if (this.readerAutoClosed) {
        // Note: If you switch to another tab and quickly switch back
        // to the current tab, the following call may have no effect
        // because the BarcodeReader may not be completely closed yet.
        // Once the BarcodeReader is closed, you may use the Open Reader
        // button to create a new BarcodeReader object.
        this.openBarcodeReader()
      }
    }
  }

  setup = () => {
    // Create a BarcodeReaders object to query the list of available readers later.
    this.readers = new window.BarcodeReaders(this.onBarcodeReadersComplete)

    // Check whether the browser supports detection of the web page visibility.
    if (typeof document.webkitHidden !== "undefined") {
      // Android 4.4 Chrome
      this.hidden = "webkitHidden"
      this.visibilityChange = "webkitvisibilitychange"
    } else if (typeof document.hidden !== "undefined") {
      // Standard HTML5 attribute
      this.hidden = "hidden"
      this.visibilityChange = "visibilitychange"
    }
    if (
      this.hidden &&
      typeof document.addEventListener !== "undefined" &&
      typeof document[this.hidden] !== "undefined"
    ) {
      // Add an event listener for the visibility change of the web page.
      document.addEventListener(this.visibilityChange, this.handleVisibilityChange, false)
    }
  }

  openReader = () => {
    const scannerName = this.readerSelect
    if (scannerName !== "None") {
      this.openBarcodeReader(scannerName)
    } else {
      this.openBarcodeReader(null)
    }
  }

  onGetAvailableBarcodeReadersComplete = (result) => {
    if (result.length !== 0) {
      this.readerSelect = result[0]
      //   setR(readerSelect);
    }
  }

  onBarcodeReadersComplete = (result) => {
    if (result.status === 0) {
      this.readers.getAvailableBarcodeReaders(this.onGetAvailableBarcodeReadersComplete)
    } else {
      console.error("Fallo en crear BarcodeReaders")
    }
  }
}

export default BarocdeReaderHoneywell

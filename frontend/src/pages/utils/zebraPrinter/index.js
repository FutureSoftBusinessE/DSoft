import normalFormatDate from "../date/DDMMYYYFormatDate"
import truncateNumber from "../math/truncate"
export default class ZebraPrinter {
  #BrowserPrint
  #Zebra
  #IP_PRINTER
  constructor(IP_PRINTER) {
    this.#BrowserPrint = window.BrowserPrint
    this.#Zebra = window.Zebra
    this.#IP_PRINTER = IP_PRINTER
  }

  async #writeToSelectedPrinter(printerDeviceSelected, printproceso, lincodigo, data) {
    // data={
    //   dataLabels:[],
    // cliciacianombre:""
    // }

    const allLabels = []
    const dataLabels = data?.dataLabels
    switch (printproceso) {
      case "QR":
        // ------------ZEBRA ZD230----------------------
        if (lincodigo === "ZEBRA ZD230") {
          for (const product of dataLabels) {
            const numberLabelsToPrint = product.artcantactual

            for (let i = 0; i < numberLabelsToPrint; i++) {
              const zplString = `^XA
              ~TA000
              ~JSN
              ^LT0
              ^MNW
              ^MTT
              ^PON
              ^PMN
              ^LH0,0
              ^JMA
              ^PR4,4
              ~SD23
              ^JUS
              ^LRN
              ^CI27
              ^PA0,1,1,0
              ^XZ
              ^XA
              ^MMT
              ^PW304
              ^LL203
              ^LS0
              ^FO153,63^GFA,269,1680,16,:Z64:eJytk0EOhCAMRWtcsPQI3EQvNokmXExvwhFYsjD++ZRkhrUtC+xjUaGvBYAcgMQvDhEYuYrMOVxlziKLB29IOZw8xOPGQHHlfujD7f2yLmmsh4HVTyWPvgysK/xDK+OUHeHkVRk5sEyl7YtKcuDwMD/DD/O3elqZ+x31qpTuwFw7+tBofgfmTy5Kl/Xny8DaP2ztREkerFetE26+v3hwGz3OyxFpyou1lJ78yIzu28z6fiaOYz3ec/fD/o6j7/f8BeWq51g=:FC8B
              ^FT0,83^A0N,39,38^FB165,1,10,C^FH\\^CI28^FD$${truncateNumber(product.precio)}^FS^CI27
              ^FT39,141^A0N,22,23^FH\\^CI28^FD${product.descripcion}^FS^CI27
              ^FT163,51^A0N,25,23^FH\\^CI28^FD${product.codigo}^FS^CI27
              ^FT31,112^A0N,12,13^FH\\'^CI28^FDPrecio Incluye Iva^FS^CI27
              ^PQ1,0,1,Y
              ^XZ

              ^FX Third section with bar code.
              ^BY5,2,270
              ^FO100,550^BC^FD${product.codigo}^FS

              ^FX Fourth section (the two boxes on the bottom).
              ^FO50,900^GB700,250,3^FS
              ^FO400,900^GB3,250,3^FS
              ^CF0,40
              ^FO100,960^FDCtr. X34B-1^FS
              ^FO100,1010^FDREF1 F00B47^FS
              ^FO100,1060^FDREF2 BL4H8^FS
              ^CF0,190
              ^FO470,955^FDCA^FS

              ^XZ`

              allLabels.push(zplString)
            }
          }
          break
        }

        // ------------ZEBRA ZEBRAPRACTI----------------------
        if (lincodigo === "ZEBRAPRACTI") {
          const codeType = "qrcode"
          const temporalProductsToPrint = data.dataLabels
          if (codeType === "qrcode") {
            // Format all zpl qr codes of products

            const formatQR = (codigo) => {
              return "/productos/get_producto_por_codigo-" + codigo + "*"
            }

            temporalProductsToPrint.forEach((producto) => {
              const numEtiquetas = Math.floor(producto.artcantactual) || 0
              const labelsPerProducto = []
              for (let i = 0; i < numEtiquetas; i += 2) {
                console.log(numEtiquetas, i, i + 2, i + 2 <= numEtiquetas)
                labelsPerProducto.push(
                  `^XA^PR7^MD15^CI28^FO47,170^BQN,2,6^FD  ${
                    formatQR(producto?.codigo) + `^FS^FO10,50^A0N,15,15^FD${producto.descripcion}^FS`
                  }${
                    i + 2 <= numEtiquetas
                      ? "^FS^FO390,170^BQN,2,6^FD" +
                        "  " +
                        formatQR(producto?.codigo) +
                        `^FS^FO353,50^A0N,15,15^FD${producto.descripcion}^FS`
                      : ""
                  }^FS^XZ`,
                )
              }
              allLabels.push(...labelsPerProducto)
            })
          } else {
            // Format all zpl bar codes of products

            const formatBar = (codigo) => {
              return codigo + "*"
            }

            temporalProductsToPrint.forEach((producto) => {
              const numEtiquetas = Math.floor(producto.artcantactual) || 0
              const labelsPerProducto = []
              for (let i = 0; i < numEtiquetas; i += 2) {
                console.log(numEtiquetas, i, i + 2, i + 2 <= numEtiquetas)
                labelsPerProducto.push(
                  `^XA^PR2,2,2^FO100,30^BY3^BCR,100,Y,N,N^FD${
                    formatBar(producto?.codigo) + `^FS^FO210,30^A0R,15,15^FD${producto.descripcion}^FS`
                  }${
                    i + 2 <= numEtiquetas
                      ? "^FS^FO450,30^BY3^BCR,100,Y,N,N^FD" +
                        formatBar(producto?.codigo) +
                        `^FS^FO560,30^A0R,15,15^FD${producto.descripcion}^FS`
                      : ""
                  }^FS^XZ`,
                )
              }
              allLabels.push(...labelsPerProducto)
            })
          }
          break
        }

        break
      case "BARRA":
        // ------------ZEBRA ZD230----------------------
        if (lincodigo === "ZEBRA ZD230") {
          for (const product of dataLabels) {
            const numberLabelsToPrint = product.artcantactual

            for (let i = 0; i < numberLabelsToPrint; i++) {
              const zplString = `^XA
              ~TA000
              ~JSN
              ^LT0
              ^MNW
              ^MTT
              ^PON
              ^PMN
              ^LH0,0
              ^JMA
              ^PR4,4
              ~SD23
              ^JUS
              ^LRN
              ^CI27
              ^PA0,1,1,0
              ^XZ
              ^XA
              ^MMT
              ^PW304
              ^LL203
              ^LS0
              ^BY2,3,40^FT51,167^BCN,,Y,N
              ^FH\\^FD${product.codigo}^FS
              ^FT0,63^A0N,35,33^FB291,1,9,C^FH\\^CI28^FD${data.ciaalias}^FS^CI27
              ^FT0,110^A0N,28,28^FH\\^CI28^FD$${data.precioUnitarioMasIva}^FS^CI27
              ^FT107,121^A0N,22,23^FH\\^CI28^FD${product.descripcion}^FS^CI27
              ^FT104,95^A0N,20,20^FH\\^CI28^FD${product.codigo}^FS^CI27
              ^PQ1,0,1,Y
              ^XZ`
              allLabels.push(zplString)
            }
          }

          break
        }

        // ------------ZEBRAPRACTI----------------------
        if (lincodigo === "ZEBRAPRACTI") {
          const codeType = "barcode"
          const temporalProductsToPrint = data.dataLabels
          if (codeType === "qrcode") {
            // Format all zpl qr codes of products

            const formatQR = (codigo) => {
              return "/productos/get_producto_por_codigo-" + codigo + "*"
            }

            temporalProductsToPrint.forEach((producto) => {
              const numEtiquetas = Math.floor(producto.artcantactual) || 0
              const labelsPerProducto = []
              for (let i = 0; i < numEtiquetas; i += 2) {
                console.log(numEtiquetas, i, i + 2, i + 2 <= numEtiquetas)
                labelsPerProducto.push(
                  `^XA^PR7^MD15^CI28^FO47,170^BQN,2,6^FD  ${
                    formatQR(producto?.codigo) + `^FS^FO10,50^A0N,15,15^FD${producto.descripcion}^FS`
                  }${
                    i + 2 <= numEtiquetas
                      ? "^FS^FO390,170^BQN,2,6^FD" +
                        "  " +
                        formatQR(producto?.codigo) +
                        `^FS^FO353,50^A0N,15,15^FD${producto.descripcion}^FS`
                      : ""
                  }^FS^XZ`,
                )
              }
              allLabels.push(...labelsPerProducto)
            })
          } else {
            // Format all zpl bar codes of products

            const formatBar = (codigo) => {
              return codigo + "*"
            }

            temporalProductsToPrint.forEach((producto) => {
              const numEtiquetas = Math.floor(producto.artcantactual) || 0
              const labelsPerProducto = []
              for (let i = 0; i < numEtiquetas; i += 2) {
                console.log(numEtiquetas, i, i + 2, i + 2 <= numEtiquetas)
                labelsPerProducto.push(
                  `^XA^PR2,2,2^FO100,30^BY3^BCR,100,Y,N,N^FD${
                    formatBar(producto?.codigo) + `^FS^FO210,30^A0R,15,15^FD${producto.descripcion}^FS`
                  }${
                    i + 2 <= numEtiquetas
                      ? "^FS^FO450,30^BY3^BCR,100,Y,N,N^FD" +
                        formatBar(producto?.codigo) +
                        `^FS^FO560,30^A0R,15,15^FD${producto.descripcion}^FS`
                      : ""
                  }^FS^XZ`,
                )
              }
              allLabels.push(...labelsPerProducto)
            })
          }
          break
        }
        break
      case "ZEBRA":
        // ------------Printer for Warehouse----------------------
        // Aqui voy a imprimir todos las etiquetas lotes de cada producto del pallet
        // let clicodigo = data.clicodigo

        if (lincodigo === "PrinterLote") {
          const numIngreso = data.numIngreso
          const fecIngreso = data.fecIngreso
          const numSol = data.numSol
          const clinombre = data.clinombre
          for (const product of dataLabels) {
            // const numberLabelsToPrint = product.artcantactual;

            const numEtiquetas = 1
            const labelsPerProducto = [] // aqui se guarda todas las etitquetas lotes del producto actual
            // Info sobre los articulos
            const {
              artcodigo,
              artdescri,
              artregissani,
              artobserva,
              arttemperatura,
              // eslint-disable-next-line no-unused-vars
              artconcentra,
              predescri,
              // eslint-disable-next-line no-unused-vars
              marcodigo,
              mardescri,
              // eslint-disable-next-line no-unused-vars
              medcodigo,
              meddescri,
              artcodbarra,
              // eslint-disable-next-line no-unused-vars
              artalias,
              artcodigo2,
              artcomentari,
            } = product

            for (const lote of product.lotes) {
              const {
                codigoLote, // eslint-disable-next-line no-unused-vars
                cantidadLote,
                fechaElaboracionLote,
                fechaVencimientoLote,
              } = lote

              for (let i = 0; i < numEtiquetas; i++) {
                let zplString = `^XA
                            ^BY4,3,67^FT25,85^BCN,,N,N
                            ^FD>;${numIngreso}^FS
                            ^FT664,83^A0N,25,24^FH\\^FD${fecIngreso}^FS
                            ^FT485,83^A0N,25,24^FH\\^FDFECHA DE ING.:^FS
                            ^FT662,48^A0N,28,28^FH\\^FD${numIngreso}^FS
                            ^FT28,421^A0N,25,24^FH\\^FD${artobserva}^FS
                            ^FT400,48^A0N,28,28^FH\\^FDORDEN DE INGRESO N\\F8^FS
                            ^FT402,180^A0N,17,16^FH\\^FDPRESENTACION:^FS
                            ^FT520,180^A0N,17,16^FH\\^FD${predescri}^FS
                            ^FT530,157^A0N,17,16^FH\\^FD${"ninguno"}^FS
                            ^FT402,157^A0N,17,16^FH\\^FDPRINCIPIO ACTIVO:^FS
                            ^FT166,157^A0N,17,16^FH\\^FD${artdescri}^FS
                            ^FT23,157^A0N,17,16^FH\\^FDNOMBRE COMERCIAL:^FS
                            ^FT135,180^A0N,17,16^FH\\^FD${meddescri}^FS
                            ^FT23,180^A0N,17,16^FH\\^FDTIPODEENVASE:^FS
                            ^FT225,134^A0N,17,16^FH\\^FDCODIGO PROV.:^FS
                            ^FT370,134^A0N,17,16^FH\\^FD${artcodigo2}^FS
                            ^FT405,371^A0N,17,16^FH\\^FDCOMERCIALIZADOR:^FS
                            ^FT27,369^A0N,17,16^FH\\^FDFABRICANTE:^FS
                            ^FT332,345^A0N,17,16^FH\\^FDVALIDEZ REG.SAN.:^FS
                            ^FT27,345^A0N,17,16^FH\\^FDREG. SAN.:^FS
                            ^FT551,371^A0N,17,16^FH\\^FD${clinombre}^FS
                            ^FT516,322^A0N,17,16^FH\\^FDFECHA VENC.:^FS
                            ^FT128,369^A0N,17,16^FH\\^FD${mardescri}^FS
                            ^FT477,345^A0N,17,16^FH\\^FD${artcomentari}^FS
                            ^FT131,345^A0N,17,16^FH\\^FD${artregissani}^FS
                            ^FT271,322^A0N,17,16^FH\\^FDFECHA ELAB.:^FS
                            ^FT620,322^A0N,17,16^FH\\^FD${normalFormatDate(fechaVencimientoLote)}^FS
                            ^FT375,322^A0N,17,16^FH\\^FD${normalFormatDate(fechaElaboracionLote)}^FS
                            ^FT28,322^A0N,17,16^FH\\^FDLOTE:^FS
                            ^FT24,134^A0N,17,16^FH\\^FDCOD. PROD.:^FS
                            ^FT87,322^A0N,17,16^FH\\^FD${codigoLote}^FS
                            ^FT147,134^A0N,17,16^FH\\^FD${artcodigo}^FS
                            ^FT194,110^A0N,20,19^FH\\^FD${numSol}^FS
                            ^FT24,110^A0N,20,19^FH\\^FDORDEN DE PEDIDO:^FS`

                // Comprobar si es producto europeo ya que ellos usan ian13 y gs1128
                if (artcodbarra?.length === 12) {
                  // el 8011 indica que es un cod barra gs1-128
                  zplString += `^BY3,2,90^FT265,281^BEN,,Y,N
                              ^FD${artcodbarra}^FS
                              ^FT141,588^A0N,28,28^FH\\^FD(01)${artcodbarra}(17)${"241017"}(10)${artcodigo}^FS
                              ^BY3,3,121^FT59,558^BCN,,N,N
                              ^FD>;>80111${artcodbarra}17${"241017"}10${artcodigo}^FS`
                } else {
                  // completar con upc con productos americanos
                }

                zplString += `^FT794,390^A0B,17,16^FH\\^FD${arttemperatura}^FS
                            ^FT794,566^A0B,17,16^FH\\^FDCOND. DE ALMACENAJE:^FS
                            ^PQ1,0,1,Y^XZ`
                zplString = zplString.replace(/\s+/g, "")

                labelsPerProducto.push(zplString)
              }
            }
            allLabels.push(...labelsPerProducto)
          }

          break
        }

        if (lincodigo === "PrinterPallet") {
          // PALLETS LABELS ----------------
          const palletID = data.palletID
          const numIngreso = data.numIngreso
          const fecIngreso = data.fecIngreso
          const clinombre = data.clinombre
          const numSol = data.numSol

          const numEtiquetas = 2
          const labelsPerPallet = []

          for (let i = 0; i < numEtiquetas; i++) {
            let zplString = `^XA
         ^FT412,70^A0N,28,28^FH\\^FDN\\A7 INGRESO:^FS
         ^FT602,70^A0N,28,28^FH\\^FD${numIngreso}^FS
         ^FT23,113^A0N,23,24^FH\\^FDFECHA DE INGRESO: ${fecIngreso}^FS
         ^FT23,149^A0N,23,24^FH\\^FDN\\A7 ORDENPEDIDO: ${numSol}^FS
         ^FT23,186^A0N,23,24^FH\\^FDCLIENTE: ${clinombre}^FS
         ^FT26,260^A0N,28,28^FH\\^FDN\\A7 PALLET:^FS
         ^BY6,3,212^FT110,487^BCN,,Y,Y^FD>;${palletID}^FS
         ^FS
         ^PQ1,0,1,Y^XZ`
            zplString = zplString.replace(/\s+/g, "")

            labelsPerPallet.push(zplString)
          }
          allLabels.push(...labelsPerPallet)
          break
        }
        break

      default:
        console.log("Nada que imprimir")
        break
    }

    // Aqui se tiene que obtener el status de la impresora para ver si esta lista para imprimir
    try {
      const isReadyPrinter = await this.#getStatusPrinter(printerDeviceSelected)
      if (!isReadyPrinter) throw new Error()

      await this.#printLabels(printerDeviceSelected, allLabels)
    } catch (err) {
      console.error(err)
      throw new Error("No se pudo imprimir. Revise el estado de su impresora")
    }
  }

  #getStatusPrinter(printerDeviceSelected) {
    return new Promise((resolve, reject) => {
      const zebraPrinter = new this.#Zebra.Printer(printerDeviceSelected)
      zebraPrinter.getStatus(
        (status) => {
          resolve(status.isPrinterReady())
        },
        (err) => {
          console.log(err)
          reject(err)
        },
      )
    })
  }

  async #printLabels(printerDeviceSelected, labels) {
    // Printing all labels
    try {
      labels.forEach((label) => {
        printerDeviceSelected.send(
          label,
          () => {
            const lastLabel = labels[labels.length - 1]
            if (label === lastLabel) {
              // alert("Etiquetas impresas");
              // setIsPrintingLabels(false); //Last label printed
            }
          },
          (errorMessage) => {
            alert("Error: " + errorMessage)
          },
        )
      })
      alert(labels.length + " Etiquetas impresas")
    } catch (err) {
      alert("No se pudo conectar a la impresora")
      // setIsPrintingLabels(false)
    }
  }

  #getLocalDevicesAsync(BrowserPrint) {
    return new Promise((resolve, reject) => {
      BrowserPrint.getLocalDevices(
        function (deviceList) {
          resolve(deviceList)
        },
        function () {
          reject(new Error("Error al obtener la lista de dispositivos locales"))
        },
        "printer",
      )
    })
  }

  async #setup(BrowserPrint) {
    try {
      const deviceList = await this.#getLocalDevicesAsync(BrowserPrint)
      return deviceList
    } catch (error) {
      // setIsLoadingPrinter(false);
      throw new Error("No se pudo obtener las impresoras en red")
    }
  }

  #getCurrentPrinterDevice(allPrintersDevices, ipPrinter) {
    const selectedPrint = allPrintersDevices.find((device) => {
      return ipPrinter.includes(device.uid.split(":")[0])
    })

    return selectedPrint
  }

  // This is the main process to print labels
  async imprimirEtiquetas(printproceso, lincodigo, dataLabelsToPrint) {
    const BrowserPrint = this.#BrowserPrint
    const IP_PRINTER = this.#IP_PRINTER // GET IP FROM LOCALSTORAGE

    try {
      // OBTENER TODAS LAS IMPRESORAS QUE ESTE EN LA RED
      const allPrintersDevices = await this.#setup(BrowserPrint)
      // OBTNER SOLO LA IMPRESORA QUE COINCIDA CON LA IP DEL USUARIO
      const printerDeviceSelected = this.#getCurrentPrinterDevice(allPrintersDevices, IP_PRINTER)
      if (!printerDeviceSelected) throw new Error(`No se pudo conectar a la impresora ${IP_PRINTER}`)

      await this.#writeToSelectedPrinter(printerDeviceSelected, printproceso, lincodigo, dataLabelsToPrint)
    } catch (error) {
      alert(error.message)
      console.error(error)
      throw new Error("Error en el proceso de impresion")
    }
  }
}

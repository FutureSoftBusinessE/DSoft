// app/FacturaDesdeArticulos/components/AccordionFiltros.jsx

import { useState, useImperativeHandle, forwardRef } from "react"
import { Box, Button, Grid, Typography, CircularProgress, Checkbox, FormControlLabel } from "@mui/material"
import { styled } from "@mui/material/styles"
import LoadingButton from "@mui/lab/LoadingButton"
import BuscarIcon from "../../../assets/iconos/Buscar.ico"

import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"
import AsyncDebounceMultiSelect from "../../../components/CustomAsyncDebounceMultiSelect"
import InputNestedChildren from "../../../components/CustomInputNestedChildren"
import CustomTextField from "../../../components/CustomTextField"

import fetchwrapper from "../../../services/interceptors/fetchwrapper"

const StyledButtonContainerFiltro = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  marginLeft: theme.spacing(2),
  marginRight: theme.spacing(2),
}))

const ContainerFiltrosGeneralesFA = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto auto auto auto auto",
  gridTemplateAreas: `
    "IProducto IProducto IProducto IProducto IProducto IProducto IPresentacion IPresentacion IPresentacion IPresentacion IPresentacion IPresentacion"
    "IMedida IMedida IMedida IMedida IMedida IMedida IMarca IMarca IMarca IMarca IMarca IMarca"
    "ILinea ILinea ILinea ILinea ILinea ILinea IIMR IIMR IIMR IIMR IIMR IIMR"
    "IParams IParams IParams IParams IParams IParams IParams IParams IParams IParams IParams IParams"
    "IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar"
  `,
  gap: "8px",
  rowGap: "12px",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "auto auto auto auto auto auto auto auto",
    gridTemplateAreas: `
      "IProducto"
      "IPresentacion"
      "IMedida"
      "IMarca"
      "ILinea"
      "IIMR"
      "IParams"
      "IBtnFiltrar"
    `,
  },
}))

const IProducto = styled(Box)({ gridArea: "IProducto" })
const IPresentacion = styled(Box)({ gridArea: "IPresentacion" })
const IMedida = styled(Box)({ gridArea: "IMedida" })
const IMarca = styled(Box)({ gridArea: "IMarca" })
const ILinea = styled(Box)({ gridArea: "ILinea" })
const IIMR = styled(Box)({ gridArea: "IIMR" })
const IParams = styled(Box)({ gridArea: "IParams" })
const IBtnFiltrar = styled(Box)({ gridArea: "IBtnFiltrar" })

const AccordionFiltros = forwardRef(({ onFilteredProducts, clicodigo, factippag }, ref) => {
  const [isExpandedFiltrosGeneralesFA, setIsExpandedFiltrosGeneralesFA] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [filtrosGenerales, setFiltrosGenerales] = useState({
    articulos: [],
    presentaciones: [],
    medidas: [],
    marcas: [],
    lineas: [],
    imr: "",
  })
  const [productosConCantidad, setProductosConCantidad] = useState(false)

  const handleSetFiltrosGenerales = (k, v) => setFiltrosGenerales((prev) => ({ ...prev, [k]: v }))

  useImperativeHandle(ref, () => ({
    handleFiltros: () => {
      aplicarFiltros()
    },
  }))

  const getCodesFiltros = (arr, key) => {
    if (arr && arr.length > 0) {
      return arr.map((i) => i?.[key]?.trim())
    }
    return []
  }

  const aplicarFiltros = async () => {
    setIsLoading(true)
    try {
      const request = {
        clicodigo,
        factippag,
        filtros: {
          codigos: getCodesFiltros(filtrosGenerales.articulos, "artcodigo"),
          presentacion: getCodesFiltros(filtrosGenerales.presentaciones, "precodigo"),
          marca: getCodesFiltros(filtrosGenerales.marcas, "marcodigo"),
          medida: getCodesFiltros(filtrosGenerales.medidas, "medcodigo"),
          linea: getCodesFiltros(filtrosGenerales.lineas, "lincodigo"),
          imr: filtrosGenerales.imr,
          soloConStock: productosConCantidad,
        },
      }

      const options = {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      let response = await fetchwrapper(`/FacturaDesdeArticulos/getArticulosConFiltros`, options)
      response = await response.json()

      onFilteredProducts(response.data || [])
      setIsLoading(false)
    } catch (err) {
      console.error("Error al aplicar filtros:", err)
      onFilteredProducts([])
      setIsLoading(false)
    }
  }

  return (
    <div>
      <CustomFieldsetAccordion
        title="Filtros Generales"
        expanded={isExpandedFiltrosGeneralesFA}
        onToggle={() => setIsExpandedFiltrosGeneralesFA(!isExpandedFiltrosGeneralesFA)}
      >
        <ContainerFiltrosGeneralesFA>
          <IProducto>
            <AsyncDebounceMultiSelect
              label="Artículos"
              endpoint="/filter/getAny"
              endpointJson={{ label: "articulo" }}
              queryKeyModal="filterArticles"
              optionKey={(option) => option.artcodigo || option.id || option.label || ""}
              selectedOptions={filtrosGenerales.articulos}
              setSelectedOptions={(v) => handleSetFiltrosGenerales("articulos", v)}
              debounceTime={600}
              placeholder="Buscar por código o descripción"
              formatOptionLabel={(item) => {
                if (item.isCustom) {
                  return item.artcodigo || item.label || String(item)
                }
                return `${(item.artcodigo || "").trim()} - ${(item.artdescri || "").trim()}`
              }}
              noOptionsText="No se encontraron artículos"
              freeSolo={true}
              createCustomOption={(inputValue) => ({
                artcodigo: inputValue,
                artdescri: inputValue,
                isCustom: true,
              })}
            />
          </IProducto>

          <IPresentacion>
            <AsyncDebounceMultiSelect
              label="Presentación"
              endpoint="/filter/getAny"
              endpointJson={{ label: "presentacion" }}
              queryKeyModal="filterPresentacion"
              optionKey={(option) => `${option.precodigo}`}
              selectedOptions={filtrosGenerales.presentaciones}
              setSelectedOptions={(v) => handleSetFiltrosGenerales("presentaciones", v)}
              debounceTime={600}
              placeholder="Buscar por código o descripción"
              formatOptionLabel={(item) => {
                if (item.isCustom) {
                  return item.precodigo || item.label || String(item)
                }
                return `${item.precodigo?.trim() || ""} - ${item.predescri?.trim() || ""}`
              }}
              noOptionsText="No se encontraron presentaciones"
              freeSolo={true}
              createCustomOption={(inputValue) => ({
                precodigo: inputValue,
                predescri: `Presentación personalizada: ${inputValue}`,
                isCustom: true,
              })}
            />
          </IPresentacion>

          <IMedida>
            <AsyncDebounceMultiSelect
              label="Medida"
              endpoint="/filter/getAny"
              endpointJson={{ label: "medida" }}
              queryKeyModal="filterMedida"
              optionKey={(option) => `${option.medcodigo}`}
              selectedOptions={filtrosGenerales.medidas}
              setSelectedOptions={(v) => handleSetFiltrosGenerales("medidas", v)}
              debounceTime={600}
              placeholder="Buscar por código o descripción"
              formatOptionLabel={(item) => {
                if (item.isCustom) {
                  return item.medcodigo || item.label || String(item)
                }
                return `${item.medcodigo?.trim() || ""} - ${item.meddescri?.trim() || ""}`
              }}
              noOptionsText="No se encontraron medidas"
              freeSolo={true}
              createCustomOption={(inputValue) => ({
                medcodigo: inputValue,
                meddescri: `Medida personalizada: ${inputValue}`,
                isCustom: true,
              })}
            />
          </IMedida>

          <IMarca>
            <AsyncDebounceMultiSelect
              label="Marca"
              endpoint="/filter/getAny"
              endpointJson={{ label: "marca" }}
              queryKeyModal="filterMarca"
              optionKey={(option) => `${option.marcodigo}`}
              selectedOptions={filtrosGenerales.marcas}
              setSelectedOptions={(v) => handleSetFiltrosGenerales("marcas", v)}
              debounceTime={600}
              placeholder="Buscar por código o descripción"
              formatOptionLabel={(item) => {
                if (item.isCustom) {
                  return item.marcodigo || item.label || String(item)
                }
                return `${item.marcodigo?.trim() || ""} - ${item.mardescri?.trim() || ""}`
              }}
              noOptionsText="No se encontraron marcas"
              freeSolo={true}
              createCustomOption={(inputValue) => ({
                marcodigo: inputValue,
                mardescri: `Marca personalizada: ${inputValue}`,
                isCustom: true,
              })}
            />
          </IMarca>

          <ILinea>
            <InputNestedChildren
              endpoint="/linea/get_lineas"
              label="Línea"
              placeholder="Filtrar por línea"
              value={filtrosGenerales.lineas}
              onChange={(v) => handleSetFiltrosGenerales("lineas", v)}
              fetchResponse={{
                code: "lincodigo",
                description: "lindescri",
              }}
              noOptionsText="No se encontraron líneas"
            />
          </ILinea>

          <IIMR>
            <CustomTextField
              label="IMR/EMR"
              value={filtrosGenerales.imr}
              setValue={(v) => handleSetFiltrosGenerales("imr", v)}
            />
          </IIMR>
        </ContainerFiltrosGeneralesFA>

        <IParams>
          <FormControlLabel
            control={
              <Checkbox
                checked={productosConCantidad}
                onChange={() => setProductosConCantidad(!productosConCantidad)}
                color="primary"
              />
            }
            label="Solo productos con stock"
          />
        </IParams>

        <IBtnFiltrar>
          <div className={StyledButtonContainerFiltro}>
            <LoadingButton
              variant="contained"
              endIcon={<img src={BuscarIcon} style={{ width: "22px" }} alt="buscar" />}
              onClick={aplicarFiltros}
              color="secondary"
              loading={isLoading}
              style={{ marginRight: "16px" }}
            >
              Filtrar
            </LoadingButton>
          </div>
        </IBtnFiltrar>
      </CustomFieldsetAccordion>
    </div>
  )
})

export default AccordionFiltros

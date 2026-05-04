import React, { useEffect, useState } from "react"
import { TextField } from "@mui/material"
import CustomAutocomplete from "../../../components/CustomAutocomplete"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useQuery } from "@tanstack/react-query"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"

const CrearAccesoModal = ({ formData, setFormData }) => {
  const [companias, setCompanias] = useState(null)
  const [modulos, setModulos] = useState(null)

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ["modalInfoAccesosBuscar"],
    queryFn: async () => {
      const response = await fetchwrapper(`/AccesoACompaniasYModulos/getAllInfoModalAccesos`)
      const result = await response.json()
      return result.data
    },
  })

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setCompanias(data.companias)
      setModulos(data.modulos)
    }
  }, [data])

  return (
    <>
      <CustomBackdrop isLoading={isLoading || isRefetching} />

      <CustomAutocomplete
        label="Compañía"
        selectedOption={formData.compania}
        setSelectedOption={(compania) => {
          setFormData("compania", compania)
        }}
        options={companias}
      />

      <CustomAutocomplete
        label="Módulo"
        selectedOption={formData.modulo}
        setSelectedOption={(modulo) => {
          setFormData("modulo", modulo)
        }}
        options={modulos}
      />

      <TextField
        fullWidth
        label="Acción"
        value={formData.accion}
        InputProps={{
          readOnly: true,
        }}
        variant="outlined"
        helperText="La acción por defecto para nuevos accesos es CREATE"
      />
    </>
  )
}

export default CrearAccesoModal

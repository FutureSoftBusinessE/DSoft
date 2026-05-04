// tiposDocumentos.js
export const tiposDocumentos = [
  { tipdoccodigo: "CED", tipdocdescri: "CÉDULA", value: "CED", label: "CÉDULA" },
  { tipdoccodigo: "CPR", tipdocdescri: "CERTIFICADOS DE PROPIEDAD", value: "CPR", label: "CERTIFICADOS DE PROPIEDAD" },
  { tipdoccodigo: "ECT", tipdocdescri: "ESTADOS DE CUENTA", value: "ECT", label: "ESTADOS DE CUENTA" },
  { tipdoccodigo: "ESC", tipdocdescri: "ESCRITURAS", value: "ESC", label: "ESCRITURAS" },
  { tipdoccodigo: "FAC", tipdocdescri: "FACTURAS", value: "FAC", label: "FACTURAS" },
  { tipdoccodigo: "CON", tipdocdescri: "CONTRATOS", value: "CON", label: "CONTRATOS" },
  { tipdoccodigo: "FOT", tipdocdescri: "FOTOS", value: "FOT", label: "FOTOS" },
  { tipdoccodigo: "PFX", tipdocdescri: "CREDENCIAL SRI (PFX)", value: "PFX", label: "CREDENCIAL SRI (PFX)" },
  { tipdoccodigo: "PF12", tipdocdescri: "CREDENCIAL SRI (PF12)", value: "PF12", label: "CREDENCIAL SRI (PF12)" },
  { tipdoccodigo: "PDF", tipdocdescri: "DOCUMENTOS PDF", value: "PDF", label: "DOCUMENTOS PDF" },
  { tipdoccodigo: "XML", tipdocdescri: "DOCUMENTOS XML", value: "XML", label: "DOCUMENTOS XML" },
  { tipdoccodigo: "XLS", tipdocdescri: "EXCEL", value: "XLS", label: "EXCEL" },
  { tipdoccodigo: "DOC", tipdocdescri: "WORD", value: "DOC", label: "WORD" },
  { tipdoccodigo: "OTR", tipdocdescri: "OTROS", value: "OTR", label: "OTROS" },
]

// Datos iniciales de ejemplo - algunos con fechas, otros sin
export const documentosMock = [
  {
    documentouuid: "550e8400-e29b-41d4-a716-446655440000",
    docsecuen: 1,
    tipdoccodigo: "CED",
    tipdocdescri: "CÉDULA",
    docextension: "jpg",
    docnombre: "Cédula de identidad",
    docfecemi: "2025-01-15", // Con fecha emisión
    docfecven: null, // Sin fecha vencimiento
    docindex1: "CLIENTE-001",
    docindex2: "JUAN PEREZ",
    docindex3: "Cédula de identidad",
    docindex4: "1234567890",
    docindex5: "",
    docfechorisys: "2025-01-15T10:30:00",
    docusuisys: "MARIA",
    docestisys: "PC-VENTAS",
    docqgenero: "EVE-2025-001",
    docprocqgenero: "CALENDARIO",
  },
  {
    documentouuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    docsecuen: 2,
    tipdoccodigo: "PF12",
    tipdocdescri: "CREDENCIAL SRI (PF12)",
    docextension: "pf12",
    docnombre: "Certificado SRI PF12",
    docfecemi: null, // Sin fecha emisión
    docfecven: "2026-01-10", // Solo fecha vencimiento
    docindex1: "RUC-0991234567001",
    docindex2: "EMPRESA EJEMPLO SA",
    docindex3: "Certificado SRI PF12",
    docindex4: "2025-01-01",
    docindex5: "VIGENTE",
    docfechorisys: "2025-01-15T11:45:00",
    docusuisys: "MARIA",
    docestisys: "PC-VENTAS",
    docqgenero: "EVE-2025-001",
    docprocqgenero: "CALENDARIO",
  },
  {
    documentouuid: "7cc8c920-9dad-11d1-80b4-00c04fd430c9",
    docsecuen: 3,
    tipdoccodigo: "PDF",
    tipdocdescri: "DOCUMENTOS PDF",
    docextension: "pdf",
    docnombre: "Documento general",
    docfecemi: null, // Sin fecha emisión
    docfecven: null, // Sin fecha vencimiento
    docindex1: "",
    docindex2: "",
    docindex3: "Documento sin fechas",
    docindex4: "",
    docindex5: "",
    docfechorisys: "2025-01-16T09:20:00",
    docusuisys: "CARLOS",
    docestisys: "PC-OFICINA",
    docqgenero: "EVE-2025-001",
    docprocqgenero: "CALENDARIO",
  },
]

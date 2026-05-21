from flask import jsonify, request
from app.ConsultaDeRuc import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from error_handling import api_endpoint, APIError, ValidationError
import requests


@bp.route("/getInfoRucSRI/<ruc>", methods=["GET"])
@cross_origin()
@jwt_required()
@api_endpoint
def get_info_ruc_sri(ruc):
    try:
        ruc_clean = "".join(filter(str.isdigit, str(ruc)))
        if len(ruc_clean) != 13:
            raise ValidationError("El RUC debe tener 13 dígitos.")
        sri_url = f"https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?ruc={ruc_clean}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36", "Referer": "https://srienlinea.sri.gob.ec/sri-en-linea/SriEnLinea/ConsultaRuc/Consultas/consultaRuc", "X-Requested-With": "XMLHttpRequest"}
        response = requests.get(sri_url, headers=headers, timeout=15)
        if response.status_code == 200:
            sri_data_list = response.json()
            if sri_data_list and len(sri_data_list) > 0:
                sri_data = sri_data_list[0]
                # Helper para extraer fechas ya sea de objeto anidado o plano
                fechas_raw = sri_data.get("informacionFechasContribuyente")
                if not isinstance(fechas_raw, dict):
                    fechas_raw = {}
                    formatted_data = {
                        "numeroRuc": sri_data.get("numeroRuc") or sri_data.get("identificacion") or ruc_clean,
                        "razonSocial": sri_data.get("razonSocial") or sri_data.get("nombreCompleto") or "",
                        "estadoContribuyenteRuc": (sri_data.get("estadoContribuyenteRuc") or sri_data.get("estadoContribuyente") or sri_data.get("descEstado") or "ACTIVO").upper(),
                        "motivoCancelacionSuspension": sri_data.get("motivoCancelacionSuspension") or "",
                        "actividadEconomicaPrincipal": (sri_data.get("actividadEconomicaPrincipal") or sri_data.get("actividadEconomicaPpal") or sri_data.get("actividadPrincipal") or sri_data.get("descripcionActividad") or "").upper(),
                        "tipoContribuyente": (sri_data.get("tipoContribuyente") or sri_data.get("descTipo") or "PERSONA NATURAL").upper(),
                        "regimen": (sri_data.get("regimen") or sri_data.get("descRegimen") or "GENERAL").upper(),
                        "categoria": (sri_data.get("categoria") or sri_data.get("descCategoria") or "N/A").upper(),
                        "obligadoLlevarContabilidad": (sri_data.get("obligadoLlevarContabilidad") or sri_data.get("obligadoContabilidad") or sri_data.get("obligado") or "NO").upper(),
                        "agenteRetencion": "SI" if (sri_data.get("agenteRetencion") == "S" or sri_data.get("esAgenteRetencion")) else "NO",
                        "contribuyenteEspecial": "SI" if (sri_data.get("contribuyenteEspecial") == "S" or sri_data.get("esContribuyenteEspecial")) else "NO",
                        "informacionFechasContribuyente": {
                            "fechaInicioActividades": fechas_raw.get("fechaInicioActividades") or sri_data.get("fechaInicioActividades") or sri_data.get("fecIniAct") or "",
                            "fechaCese": fechas_raw.get("fechaCese") or sri_data.get("fechaCese") or sri_data.get("fecCese") or "",
                            "fechaReinicioActividades": fechas_raw.get("fechaReinicioActividades") or sri_data.get("fechaReinicioActividades") or sri_data.get("fecReinAct") or "",
                            "fechaActualizacion": fechas_raw.get("fechaActualizacion") or sri_data.get("fechaActualizacion") or sri_data.get("fecAct") or "",
                        },
                        "representantesLegales": sri_data.get("representantesLegales") or [],
                        "contribuyenteFantasma": "SI" if (sri_data.get("contribuyenteFantasma") == "S" or sri_data.get("esFantasma")) else "NO",
                        "transaccionesInexistente": "SI" if (sri_data.get("transaccionesInexistente") == "S" or sri_data.get("esTransaccionInexistente")) else "NO",
                    }
                # Verificación SIAC
                try:
                    claims = get_jwt()
                    clicianonBD = claims["seleccion"]["clicianonBD"]
                    db.session = get_session(clicianonBD)
                    engine = db.session.bind
                    with engine.connect() as conn:
                        query = text("SELECT procodigo FROM cgbprovee WHERE proruc = :ruc")
                        res = conn.execute(query, {"ruc": ruc_clean}).fetchone()
                        formatted_data["ya_registrado"] = True if res else False
                        if res:
                            formatted_data["local_codigo"] = res[0]
                except Exception as e:
                    raise APIError(str(e))
                    formatted_data["ya_registrado"] = False
                return formatted_data
            else:
                raise APIError(f"RUC {ruc_clean} no encontrado.")
        else:
            raise APIError("SRI no responde adecuadamente.")
    except Exception as e:
        raise APIError(str(e))

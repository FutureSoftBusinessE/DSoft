def validar_ruc_cedula(s_numero, s_tipo="", sin_msg=False):
    try:
        s_tit_mess = ""
        i_modulo = 10  # Por defecto para Cédula/Ruc Persona Natural
        b_result = False
        s_error_message = None

        # Determinar el mensaje según el tipo
        tipo_dict = {
            "C": " del Cliente ",
            "CM": " del Cliente Matriz ",
            "E": " del(a) Conyuge ",
            "R": " del Representante ",
            "G": " del Garante ",
            "D": " del CoDeudor ",
            "P": " del Proveedor ",
            "PM": " del Proveedor Matriz ",
            "I": " del Integrador ",
        }
        s_tit_mess = tipo_dict.get(s_tipo, "")

        # Verificar que contenga solo números
        if not s_numero.isdigit():
            if not sin_msg:
                s_error_message = f"Error: Cédula/RUC contiene valores no numéricos {s_numero}"
            return b_result, s_error_message

        # Validación de la provincia
        provincia = int(s_numero[:2])
        if provincia > 24 and provincia != 30:
            if not sin_msg:
                s_error_message = f"Error: Cédula/RUC no corresponde a ninguna Provincia {s_numero}"
            return False, s_error_message

        # Verificación de longitud
        if len(s_numero) not in [10, 13]:
            if not sin_msg:
                s_error_message = f"Error: Longitud del Número no Corresponde a una Cédula/RUC {s_tit_mess}"
            return False, s_error_message

        # Cálculo del dígito verificador
        i_digito_verificador = int(s_numero[-1])

        # Validación de cédula
        if len(s_numero) == 10:
            s_coeficiente = "212121212"
            i_acumulado = sum(int(s_numero[i]) * int(s_coeficiente[i]) - 9 if int(s_numero[i]) * int(s_coeficiente[i]) >= 10 else int(s_numero[i]) * int(s_coeficiente[i]) for i in range(9))
            i_residuo = i_acumulado % i_modulo
            i_veri = 0 if i_residuo == 0 else i_modulo - i_residuo

            if i_veri != i_digito_verificador:
                if not sin_msg:
                    s_error_message = f"Error: Dígito Verificador de Cédula {s_tit_mess} es Incorrecto"
            else:
                b_result = True

        # Validación de RUC
        else:
            i_tercer_digito = int(s_numero[2])
            if i_tercer_digito in [7, 8]:
                if not sin_msg:
                    s_error_message = f"Error: Estructura del RUC {s_tit_mess} es Incorrecta, tercer dígito no corresponde a los permitidos"
                return b_result, s_error_message

            # Validación como Empresa Pública o Persona Natural
            b_flag_empresa_publica = i_tercer_digito == 6
            while True:
                if i_tercer_digito == 9:
                    s_coeficiente = "432765432"
                    i_modulo = 11
                    i_digito_verificador = int(s_numero[9])
                elif i_tercer_digito == 6 and b_flag_empresa_publica:
                    s_coeficiente = "327654320"
                    i_modulo = 11
                    i_digito_verificador = int(s_numero[8])
                else:
                    s_coeficiente = "212121212"
                    i_modulo = 10
                    i_digito_verificador = int(s_numero[9])

                i_acumulado = sum((int(s_numero[i]) * int(s_coeficiente[i]) - 9 if (i_tercer_digito <= 6 and not b_flag_empresa_publica and int(s_numero[i]) * int(s_coeficiente[i]) >= 10) else int(s_numero[i]) * int(s_coeficiente[i])) for i in range(9))

                i_residuo = i_acumulado % i_modulo
                i_veri = 0 if i_residuo == 0 else i_modulo - i_residuo

                if i_veri != i_digito_verificador:
                    if i_tercer_digito == 6 and b_flag_empresa_publica:
                        b_flag_empresa_publica = False
                        continue  # Volver a intentar validación como Persona Natural
                    if not sin_msg:
                        s_error_message = f"Advertencia: Posible dígito Verificador de RUC {s_tit_mess} es Incorrecto. Verifique en la página del SRI"
                else:
                    b_result = True
                break

        return b_result, s_error_message

    except Exception as e:
        s_error_message = f"Error inesperado: {e}"
        return False, s_error_message

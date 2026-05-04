from sqlalchemy import text

# ------------------------------------------------------------------------------------------------
# -- Función que Mayoriza Saldos Iniciales en Dólares de Presupuesto
# -- Parámetros:
# -- sCia = Código de la Compañía
# -- sParIni = Código de la Cuenta que mayoriza hacia atrás
# -- sCenCos = Centro de Costo
# -- sTraTipo = Tipo de Transaccion R=Transferencia, T= Transacción,M=Modificaciones
# -- sSigno  = Signo de la transacción
# -- dValor = dValor en Sucres a contabilizar
# -- iAnio = Año de proceso
# -- iMes = Mes de proceso
# -- Falta el saldo de CXP
# ------------------------------------------------------------------------------------------------


def MayorizaPrPar(connection, sCia, sParIni, sCenCos, sTraTipo, sSigno, dValor, iAnio, iMes):

    sParDes = sParIni
    # iTiempo = 0
    sEjecutaTra = None

    try:
        # Actualizando el centro de costo
        if sTraTipo == "R":
            sEjecutaTra = f"""
                UPDATE pretpar SET
                    parsaltrfl = parsaltrfl {sSigno} {dValor},
                    parsalcodl = parsalcodl {sSigno} {dValor},
                    parsalactl = parsalactl {sSigno} {dValor},
                    parsalcxpl = parsalcxpl {sSigno} {dValor}
            """
        elif sTraTipo == "T":
            sEjecutaTra = f"""
                UPDATE pretpar SET
                    parsaltral = parsaltral {sSigno} {dValor},
                    parsalactl = parsalactl {sSigno} {dValor},
                    parsalcxpl = parsalcxpl {sSigno} {dValor}
            """
        elif sTraTipo == "M":
            sEjecutaTra = f"""
                UPDATE pretpar SET
                    parsalmodl = parsalmodl {sSigno} {dValor},
                    parsalcodl = parsalcodl {sSigno} {dValor},
                    parsalactl = parsalactl {sSigno} {dValor},
                    parsalcxpl = parsalcxpl {sSigno} {dValor}
            """

        # Ejecutar update tipo transacción
        connection.execute(
            text(
                f"""
                {sEjecutaTra}
                WHERE ciacodigo = :sCia
                AND parcodigo = :sParDes
                AND coscodigo = :sCenCos
                AND paranio = :iAnio
                AND parmes = :iMes
            """
            ),
            {"sCia": sCia, "sParDes": sParDes, "sCenCos": sCenCos, "iAnio": iAnio, "iMes": iMes},
        )

        # Lógica de actualización jerárquica
        while sParDes != "":
            while True:
                try:
                    # Consulta maestro de partidas
                    adorstTmp = text(
                        """
                        SELECT ciacodigo, parcodigo, parpardes, parstatus
                        FROM prempar
                        WHERE ciacodigo = :sCia AND parcodigo = :sParDes
                    """
                    )
                    result = connection.execute(adorstTmp, {"sCia": sCia, "sParDes": sParDes}).mappings().fetchone()

                    if not result:
                        raise ValueError(f"Partida {sParDes} no encontrada")

                    if result["parstatus"] != "A":
                        raise ValueError(f"Partida {sParDes} inactiva con transacciones!")

                    # Actualización maestro
                    if sTraTipo == "R":
                        sEjecutaMae = f"""
                            UPDATE prempar SET
                                parsaltrfl = parsaltrfl {sSigno} {dValor},
                                parsalcodl = parsalcodl {sSigno} {dValor},
                                parsalactl = parsalactl {sSigno} {dValor},
                                parsalcxpl = parsalcxpl {sSigno} {dValor}
                        """
                    elif sTraTipo == "T":
                        sEjecutaMae = f"""
                            UPDATE prempar SET
                                parsaltral = parsaltral {sSigno} {dValor},
                                parsalactl = parsalactl {sSigno} {dValor},
                                parsalcxpl = parsalcxpl {sSigno} {dValor}
                        """
                    elif sTraTipo == "M":
                        sEjecutaMae = f"""
                            UPDATE prempar SET
                                parsalmodl = parsalmodl {sSigno} {dValor},
                                parsalcodl = parsalcodl {sSigno} {dValor},
                                parsalactl = parsalactl {sSigno} {dValor},
                                parsalcxpl = parsalcxpl {sSigno} {dValor}
                        """

                    connection.execute(text(sEjecutaMae + " WHERE ciacodigo = :sCia AND parcodigo = :sParDes"), {"sCia": sCia, "sParDes": sParDes})

                    sParDes = result["parpardes"] if result["parpardes"] else ""
                    break  # Salir del loop interno si éxito

                except Exception as e:
                    # # Lógica de reintento por bloqueo
                    # import time
                    # time.sleep(0.5)  # Espera tipo VB
                    # iTiempo += 1
                    # if iTiempo > 10:
                    raise e

        return True

    except Exception as e:
        raise f"Error en MayorizaPrPar: {str(e)}"

# ------------------------------------------------------------------------------------------------
# Procedure : GrabaAudicionOC
# DateTime  : 20/02/2013 23:07
# Author    : George
# Purpose   : Inserta las Tablas de Audición de la Orden de Compra en SiacLib desde 06/Abril/2016
# ------------------------------------------------------------------------------------------------

from sqlalchemy import text


def GrabaAudicionOC(connection, sOC, iRevision, sCodCia):
    try:
        # Insertar en cxpcocaudicion
        query_cocaudicion = text(
            """
            INSERT INTO cxpcocaudicion (
                ciacodigo, cocid, tipocodigo, cocdescri, cocusureq, procodigo, cocfecposent, cocusuapro,
                cocfecapro, cocnumfac, cocmoneda, coctipocambio, cocsubtot, cocimp, cociva, cocdesct,
                cocvalpro, cocvalor, cocsaldo, cocvalgst, tipoReqAnt, cocstatus, cocstapag, cocfecemi,
                cocpaseant, cocfecant, cocpascon, cocfecpase, cocfecisys, cochorisys, cocusuisys, cocfecmsys,
                cochormsys, cocusumsys, loccodigo, cocobserva, numfac, tipoAfeInv, tipoReqGst, cocdui, coccerimp,
                cocmonimp, coccamimp, tipoimportacion, cocsubtotimp, cocdesctimp, cocvalorimp, cocpre, cocprearea,
                cocjus, cocctagir, cocsalpre, cocobsadi, cocviaimp, ordnumero, cocforpag, cocterpag, cocorigen,
                cocfecliq, cocfeccie, tracodciarel, tranumero, cocfecdao, cocdaonumrefe, cocdaocif, cocdaoiva,
                cocdaoice, cocdaotarice, audnumxml, cocdaotipcomp, cocdaobaseimp, cocdaobasegra, cocdaobaseice,
                cocdaotariva, impcodimportacion, cocstaimportacion, cocstainventarios, cochorposent, ptocodigo,
                coccierre, cocfectransito, cocfecarribo, transcodigo, secmod, cocidppe, cocppecierre, topusuasoppe,
                topfecasoppe, tophorasoppe, topestasoppe, topusucieppe, topfeccieppe, tophorcieppe, topestcieppe,
                notcodigo, tipoliquidacion
            )
            SELECT
                ciacodigo, cocid, tipocodigo, cocdescri, cocusureq, procodigo, cocfecposent, cocusuapro,
                cocfecapro, cocnumfac, cocmoneda, coctipocambio, cocsubtot, cocimp, cociva, cocdesct,
                cocvalpro, cocvalor, cocsaldo, cocvalgst, tipoReqAnt, cocstatus, cocstapag, cocfecemi,
                cocpaseant, cocfecant, cocpascon, cocfecpase, cocfecisys, cochorisys, cocusuisys, cocfecmsys,
                cochormsys, cocusumsys, loccodigo, cocobserva, numfac, tipoAfeInv, tipoReqGst, cocdui, coccerimp,
                cocmonimp, coccamimp, tipoimportacion, cocsubtotimp, cocdesctimp, cocvalorimp, cocpre, cocprearea,
                cocjus, cocctagir, cocsalpre, cocobsadi, cocviaimp, ordnumero, cocforpag, cocterpag, cocorigen,
                cocfecliq, cocfeccie, tracodciarel, tranumero, cocfecdao, cocdaonumrefe, cocdaocif, cocdaoiva,
                cocdaoice, cocdaotarice, audnumxml, cocdaotipcomp, cocdaobaseimp, cocdaobasegra, cocdaobaseice,
                cocdaotariva, impcodimportacion, cocstaimportacion, cocstainventarios, cochorposent, ptocodigo,
                coccierre, cocfectransito, cocfecarribo, transcodigo, secmod, cocidppe, cocppecierre, topusuasoppe,
                topfecasoppe, tophorasoppe, topestasoppe, topusucieppe, topfeccieppe, tophorcieppe, topestcieppe,
                notcodigo, tipoliquidacion
            FROM cxpcoc
            WHERE ciacodigo = :sCodCia AND cocid = :sOC
        """
        )
        connection.execute(query_cocaudicion, {"sCodCia": sCodCia, "sOC": sOC})

        # Insertar en cxptocaudicion
        query_tocaudicion = text(
            f"""
            INSERT INTO cxptocaudicion (
                ciacodigo, cocid, tocid, sercodigo, artcodigo, invcodigo, lincodigo, precodigo, medcodigo,
                toccantidad, toccantacep, tocvaloruni, tocvalorbru, tocpordsct, tocvaloriva, tocvalordsct,
                tocvalornet, toccostouni, tocvalorgst, tocstatus, tocfecisys, tochorisys, tocusuisys, tocfecmsys,
                tochormsys, tocusumsys, cocprecio, tocvaloruniimp, tocvalorbruimp, tocvalordsctimp, tocvalornetimp,
                toccostouniimp, tracodciarel, tranumero, tracantasig, artcodigo2rel, artcodigo2, artdescrirel,
                artdescri, audnumxml, artpeso, tracantnollega, toccantnc, cocprecio2, cocprecio3, cocprecio4,
                cocprecio5, cocprecio6, secmod, tipcodigo, gencodigo, topvalserppe, topusuasoppe, topfecasoppe,
                tophorasoppe, topestasoppe, topusucieppe, topfeccieppe, tophorcieppe, topestcieppe
            )
            SELECT
                ciacodigo, cocid, tocid, sercodigo, artcodigo, invcodigo, lincodigo, precodigo, medcodigo,
                toccantidad, toccantacep, tocvaloruni, tocvalorbru, tocpordsct, tocvaloriva, tocvalordsct,
                tocvalornet, toccostouni, tocvalorgst, tocstatus, tocfecisys, tochorisys, tocusuisys, tocfecmsys,
                tochormsys, tocusumsys, cocprecio, tocvaloruniimp, tocvalorbruimp, tocvalordsctimp, tocvalornetimp,
                toccostouniimp, tracodciarel, tranumero, tracantasig, artcodigo2rel, artcodigo2, artdescrirel,
                artdescri, audnumxml, artpeso, tracantnollega, toccantnc, cocprecio2, cocprecio3, cocprecio4,
                cocprecio5, cocprecio6, {iRevision} AS secmod, tipcodigo, gencodigo, topvalserppe, topusuasoppe,
                topfecasoppe, tophorasoppe, topestasoppe, topusucieppe, topfeccieppe, tophorcieppe, topestcieppe
            FROM cxptoc
            WHERE ciacodigo = :sCodCia AND cocid = :sOC
        """
        )
        connection.execute(query_tocaudicion, {"sCodCia": sCodCia, "sOC": sOC})

        # Insertar en cxptfpocaudicion
        query_tfpocaudicion = text(
            f"""
            INSERT INTO cxptfpocaudicion (
                ciacodigo, cocid, fpocsec, fpcodigo, fpocfecven, fpocmoneda, fpocvalor, fpocstatus, fpocfecisys,
                fpochorisys, fpocusuisys, fpocfecmsys, fpochormsys, fpocusumsys, audnumxml, secmod
            )
            SELECT
                ciacodigo, cocid, fpocsec, fpcodigo, fpocfecven, fpocmoneda, fpocvalor, fpocstatus, fpocfecisys,
                fpochorisys, fpocusuisys, fpocfecmsys, fpochormsys, fpocusumsys, audnumxml, {iRevision} AS secmod
            FROM cxptfpoc
            WHERE ciacodigo = :sCodCia AND cocid = :sOC
        """
        )
        connection.execute(query_tfpocaudicion, {"sCodCia": sCodCia, "sOC": sOC})

        # Insertar en cxptparccaudicion
        query_parccaudicion = text(
            f"""
            INSERT INTO cxptparccaudicion (
                ciacodigo, cocid, tipocodigo, codigo, coscodigo, parcodigo, pctacodigo, unicodigo, asiporcentaje,
                asivalor, parsecuen, parfecmsys, parhormsys, parusumsys, parestmsys, PARDEBHAB, precodigo, audnumxml,
                secmod, tipcodigo, gencodigo
            )
            SELECT
                ciacodigo, cocid, tipocodigo, codigo, coscodigo, parcodigo, pctacodigo, unicodigo, asiporcentaje,
                asivalor, parsecuen, parfecmsys, parhormsys, parusumsys, parestmsys, PARDEBHAB, precodigo, audnumxml,
                {iRevision} AS secmod, tipcodigo, gencodigo
            FROM cxptparcc
            WHERE ciacodigo = :sCodCia AND cocid = :sOC
        """
        )
        connection.execute(query_parccaudicion, {"sCodCia": sCodCia, "sOC": sOC})

        return True

    except Exception as e:
        raise f"Error en GrabaAudicionOC: {str(e)}"

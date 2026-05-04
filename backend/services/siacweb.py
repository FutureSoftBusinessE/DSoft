# flake8: noqa
import random

# class ClassGeneral:

def Encrip(sTexto, sProceso):
    iLen = len(sTexto)
    random.seed(0)
    sNewPass = ""
    sTmp = ""

    if sProceso.upper() == "E":
        # VERIFICA EL STRING INGRESADO
        for iCont in range(iLen):
            iRnd = int(random.random() * 100)
            iFacCar = iRnd - iLen + iCont
            if iFacCar < 0:
                iFacCar *= -1
            iCarac = ord(sTexto[iCont]) + iFacCar
            if iCarac > 255:
                iCarac -= 255
                while iCarac > 255:
                    iCarac -= 255

            if iCarac == 39:
                iCarac = 40

            sNewPass += chr(iCarac)

        for iCont in range(iLen-1, -1, -1):
            sTmp += sNewPass[iCont]

    else:
        # REVIERTE EL STRING INGRESADO
        for iCont in range(iLen-1, -1, -1):
            sNewPass += sTexto[iCont]

        for iCont in range(iLen):
            iRnd = int(random.random() * 100)
            iFacCar = iRnd - iLen + iCont
            if iFacCar < 0:
                iFacCar *= -1
            iCarac = ord(sNewPass[iCont]) - iFacCar
            if iCarac < 0:
                iCarac += 255
                while iCarac < 0:
                    iCarac += 255

            if iCarac == 39:
                iCarac = 40

            sTmp += chr(iCarac)

    return sTmp



def Lb_encri(sTexto: str, sAcc: str) -> str:
    iLen = len(sTexto)
    Texto2 = ""
    sTmp = ""

    if sAcc != "":
        for I in range(iLen-1, -1, -1):
            sTmp += sTexto[I]
    else:
        sTmp = sTexto

    for I in range(iLen):
        if ord(sTmp[I]) <= 127:
            Texto2 += chr(ord(sTmp[I]) + 128)
        else:
            Texto2 += chr(ord(sTmp[I]) - 128)

    return Texto2



def Lb_desen(sTexto, sAcc):
    iLen = len(sTexto)
    Texto2 = ""
    sTmp = ""

    for I in range(iLen):
        if ord(sTexto[I]) > 127:
            Texto2 += chr(ord(sTexto[I]) - 128)
        else:
            Texto2 += chr(ord(sTexto[I]) + 128)

    if sAcc != "":
        for I in range(iLen-1, -1, -1):
            sTmp += sTexto[I]
        Texto2 = sTmp

    return Texto2


# {
#     tag: 1,
#     niv2:[
#         {
#             tag: 1.1,
#             niv3:[
#                 {
#                     tag: 1.1.1
#                 },
#             ]
#         },
#         {
#             tag 1.2,
#             niv3:[
#                 {
#                     tag: 1.2.1
#                 },

#             ]
#         }
#     ]
# }
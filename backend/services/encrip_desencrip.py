# flake8: noqa
import json
import clr
import os


dll_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "SiacWebDll.dll")
clr.AddReference(dll_path)

from System import Activator
from SiacWebDll import ClassGeneral

def encriptar (usuario: str):
    # Obtener el tipo CLR correspondiente a ClassGeneral
    ClassGeneralType = clr.GetClrType(ClassGeneral)

    # Crear una instancia del objeto
    my_object = Activator.CreateInstance(ClassGeneralType)
    # codigo = '{G…V]DV'
    # clave ='­||ki'
    #normal= 'fsoft'
    texto_encriptado = my_object.Encrip(usuario, "E")
    print('USE ENCRIP E ------ Texto normal: '+usuario+'  , Texto encriptado: '+ texto_encriptado)
    return texto_encriptado

def desencriptar (usuario_encriptado: str):
    # Obtener el tipo CLR correspondiente a ClassGeneral
    ClassGeneralType = clr.GetClrType(ClassGeneral)
    # Crear una instancia del objeto
    my_object = Activator.CreateInstance(ClassGeneralType)
    codigo = '{G…V]DV'
    #clave ='­||ki'
    #normal= 'fsoft'
    texto_desencriptado = my_object.Encrip(usuario_encriptado, "D")
    #print('USE ENCRIP E ------ Texto normal: fsoft  , Texto encriptado: '+ texto_encriptado)
    print('USE ENCRIP D ------ usr codigo =  '+usuario_encriptado+ ' Texto desencriptado:' + texto_desencriptado)
    return texto_desencriptado

# encriptar('fsoft')
#desencriptar('I4bªszuj')

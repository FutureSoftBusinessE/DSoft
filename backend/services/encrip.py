# flake8: noqa

import json
import clr

# clr.AddReference(r"/home/sr-coloma/Documentos/git-folder/SiacPracticasa_Proyecto/api-Backend/services/SiacWebDll.dll")
#clr.AddReference(r"/home/sr-coloma/Documentos/git-folder/SiacPracticasa_Proyecto/api-Backend/services/SiacWebDllv1.dll")
# clr.AddReference('SiacWebDllv1')
clr.AddReference(r"C:\Users\emily\OneDrive\Escritorio\ESPOL\2022-II\empresariales\proyectoFuture\SiacPracticasa_Proyecto\api-Backend\services\SiacWebDll.dll")
#clr.AddReference('Microsoft.VisualBasic')

from System import Activator
from SiacWebDll import ClassGeneral

# Obtener el tipo CLR correspondiente a ClassGeneral
ClassGeneralType = clr.GetClrType(ClassGeneral)

# Crear una instancia del objeto
my_object = Activator.CreateInstance(ClassGeneralType)


codigo = '{G…V]DV'
clave ='­||ki'
normal = 'fsoft'


texto_encriptado = my_object.Encrip(normal, "E")
texto_desencriptado1 = my_object.Encrip(codigo, "D")
# texto_desencriptado2 = my_object.encrip(encri2, "D")
print('USE ENCRIP E ------ Texto normal: fsoft  , Texto encriptado: '+ texto_encriptado)
print('USE ENCRIP D ------ usr codigo =  '+codigo+ ' Texto normal:' + texto_desencriptado1)
# print('USE ENCRIP D ------ usr codigo =  '+encri2+ ' Texto normal:' + texto_desencriptado2)
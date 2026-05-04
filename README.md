# FutureSoftBusiness

Sistema ERP web encargado de la automatización de procesos para diferentes empresas.

## Comenzando 🚀

Estas instrucciones te permitirán obtener una copia del proyecto en tu máquina local para propósitos de desarrollo y pruebas.

### Pre-requisitos 📋

Antes de comenzar, asegúrate de tener instalado lo siguiente:

1. **Editor de Código**
   - [Visual Studio Code](https://code.visualstudio.com/download/)

2. **Entorno de Ejecución**
   - [Node.js 20.11.0 LTS](https://nodejs.org/download/release/v20.11.0/)
     - **Nota**: Esta versión específica es importante para compatibilidad, descargue el ejecutable llamado node-v20.11.0-x64.msi
     - npm 10.2.4 se instala automáticamente con Node.js

3. **Python**
   - [Python 3.11.2](https://www.python.org/downloads/release/python-3112/)
   - Asegúrate de marcar "Add Python to PATH" durante la instalación

4. **Control de Versiones**
   - [Git](https://git-scm.com/)


### Clonación del repositorio 📋
Para descargar el proyecto, ejecuta:
```
git clone -b dev2 https://github.com/FutureSoftBusinessE/SIACDEV1.0.git
```

**Nota:** La rama `dev2` contiene el código más actualizado que está desplegado en producción.

### Flujo de trabajo para nuevos desarrolladores

Una vez clonado el repositorio, sigue estos pasos:

1. **Crea una rama con tu nombre** para trabajar:
```
git checkout -b tu-nombre-dev
```

2. **Realiza tus cambios** en esa rama personal.

3. **Sube tu rama** al repositorio remoto:
```
git push origin tu-nombre-dev
```

4. **Crea un Pull Request** desde tu rama hacia `dev2` para que tus cambios sean revisados e integrados.

### Instalación de las reglas de revisión de código🔧
```
cd SIACDEV1.0/
npm install
```
Este comando instalará las herramientas necesarias para revisar y corregir el código automáticamente antes de subir el código al repositorio.

### Instalación Frontend 🔧

#### Ubicación del proyecto:
SIACDEV1.0/frontend/

#### Pasos de instalación:

1. **Navega a la carpeta del frontend:**
```
cd SIACDEV1.0/frontend/
```

2. **Instala las dependencias:**
```
npm install
```
Este comando descargará automáticamente todas las dependencias especificadas en el archivo `package.json`.

3. **Inicia la aplicación en modo desarrollo:**
```
npm start
```
#### Verificación:
- El frontend se abrirá automáticamente en: `http://localhost:3000`

**Si se abre la aplicación en el navegador:** ✅ La instalación fue exitosa.

**Si no se abre o aparece un error:** ❌ Hubo un problema en la instalación.
- Revisa los mensajes de error en la terminal
- Verifica que ejecutaste `npm install` correctamente
- Confirma que no hay otra aplicación usando el puerto 3000
#### Problema: Windows bloquea la ejecución de scripts npm
Al ejecutar `npm install` o `npm start`, Windows puede bloquear la instalación o ejecución de las dependencias. **Ejecutar este comando para cambiar la política de ejecución:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Instalación Backend 🔧

#### Ubicación del proyecto:
SIACDEV1.0/backend/

#### Pasos de instalación:

1. **Abrir PowerShell como administrador** (Windows)

2. **Navegar a la carpeta del backend:**
```
cd SIACDEV1.0\backend\
```

3. **Crear el entorno virtual (.venv):**
```
python -m venv .venv
```
4. **Activar el entorno virtual en PowerShell:**
```
.\.venv\Scripts\activate
```


5. **Instalar las dependencias del proyecto:**
```
pip install -r requirements.txt
```

**IMPORTANTE:** Asegúrate de que el entorno virtual (.venv) esté activado antes de ejecutar este comando.

6. **Iniciar el servidor Flask en modo debug:**
```
flask run --debug
```
#### Verificación:
- El backend estará disponible en: `http://localhost:5000`

**Si al abrir esa URL ves una lista de APIs:** ✅ La instalación fue exitosa.

**Si no ves nada o aparece un error:** ❌ Hubo un problema en la instalación.
- Revisa los mensajes de error en la terminal PowerShell
- Verifica que el entorno virtual esté activado
- Confirma que instalaste las dependencias con `pip install -r requirements.txt`
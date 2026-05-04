# odbcinst -j 
```
unixODBC 2.3.9
DRIVERS............: /etc/odbcinst.ini
SYSTEM DATA SOURCES: /etc/odbc.ini
FILE DATA SOURCES..: /etc/ODBCDataSources
USER DATA SOURCES..: /home/sr-coloma/.odbc.ini
SQLULEN Size.......: 8
SQLLEN Size........: 8
SQLSETPOSIROW Size.: 8
```

# dependencias
```
Flask                  2.2.2
flask-marshmallow      0.14.0
Flask-SQLAlchemy       3.0.3
marshmallow            3.19.0
marshmallow-sqlalchemy 0.28.1
pymssql                2.2.7
python-decouple        3.7
python-dotenv          0.21.1
SQLAlchemy             2.0.3
```

# instalación
#### crear un archivo .env en la raiz del proyecto con las siguientes variables de entorno

```bash
DB_SERVER=xxxxxxxxxxxxxxx
DB_USER=xxxxxx
DB_PASS=xxxxxx
DB_PORT=xxxxxx
```

con su respectivo valor

#### ejecuta: 


```bash
pip install -r requirements.txt

export FLASK_APP=app
export FLASK_ENV=development
export FLASK_DEBUG=true

flask run

```

## extender

para crear un nuevo modulo en el servidor, se debe crear una carpeta con el nombre del modulo, dentro de la carpeta se debe crear un archivo llamado \_\_init__.py, con el siguiente contenido:


```python
from flask import Blueprint
bp = Blueprint('nombre_del_modulo', __name__)
```


y un archivo llamado routes.py con las rutas definidas pero con el decorador de bluprint:

```python
@bp.route('/endpoint')
```

adicionalmente se debe importar el blueprint en el archivo \_\_init__.py de la raiz del proyecto: "app/\_\_init__.py"
de la siguiente manera:


```python
from app.MODULONOMBRE import bp as MODULONOMBRE_bp
    app.register_blueprint(MODULONOMBRE_bp, url_prefix='/MODULONOMBRE') # url_prefix puede ser otro valor

```



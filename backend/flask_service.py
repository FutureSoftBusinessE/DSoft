# flake8: noqa
# Al ejecutar flask_service.py, se crearÃ¡ una instancia de la aplicación Flask y se iniciarÃ¡ el servidor web
# para que la aplicación estÃ© disponible en la dirección IP pÃºblica del servidor en el puerto 80. AdemÃ¡s, se
# habilita el modo de depuración con el parÃ¡metro debug=True, lo que permite ver información detallada sobre
# los errores en la aplicación en caso de que ocurran.
from app import create_app
from dotenv import load_dotenv
from decouple import config as config_env
from waitress import serve

load_dotenv()  # Carga .env por defecto


app = create_app()

try:
    current_env = config_env("APP_ENV")

    # Verficar la existencia del ambiente actual
    if not current_env:
        raise Exception("No se tiene configurado un ambiente en la variable de entorno APP_ENV")

    # Levantar el backend dependiendo del ambiente
    current_host = config_env("APP_HOST")
    current_port = config_env("APP_PORT")

    if not current_host:
        raise Exception("No se ha configurado APP_HOST")

    if not current_port:
        raise Exception("No se ha configurado APP_PORT")

    print(f"Iniciando servidor en ambiente {current_env}, " f"escuchando en {current_host}:{current_port}")

    if current_env == "development":
        app.run(host=current_host, port=current_port, debug=True)

    if current_env == "staging" or current_env == "production":
        serve(app, host=current_host, port=current_port, threads=8, ident=None)

except Exception as error:
    print(f"No se pudo levantar el servidor backend: {error}")

# flake8: noqa
# Al ejecutar flask_service.py, se crearÃ¡ una instancia de la aplicación Flask y se iniciarÃ¡ el servidor web
# para que la aplicación estÃ© disponible en la dirección IP pÃºblica del servidor en el puerto 80. AdemÃ¡s, se
# habilita el modo de depuración con el parÃ¡metro debug=True, lo que permite ver información detallada sobre
# los errores en la aplicación en caso de que ocurran.
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80, debug=True)

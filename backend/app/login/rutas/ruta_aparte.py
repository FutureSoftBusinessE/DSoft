# flake8: noqa
from app.login import bp
from flask_cors import cross_origin


@bp.route("/easterEgg", methods=["GET"])
@cross_origin()
def aparte():
    return "encontraste un easter egg"  # render_template('login/index.html')

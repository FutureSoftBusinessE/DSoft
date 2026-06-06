# flake8: noqa
from app.login import bp


@bp.route("/easterEgg", methods=["GET"])
def aparte():
    return "encontraste un easter egg"  # render_template('login/index.html')

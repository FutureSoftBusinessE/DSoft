# flake8: noqa
def paginate(page, limit, query):
    offset = (page - 1) * limit
    items = query.limit(limit).offset(offset).all()
    total = query.count()
    return items, total

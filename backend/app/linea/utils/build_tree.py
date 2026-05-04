# flake8: noqa


def has_children(item_number, items):
    for item in items:
        if item["linlindes"].startswith(item_number):
            return True
    return False


def build_tree(items, parent_id=None):
    children = []
    for item in items:
        if item["linlindes"] == parent_id:
            # if parent_id.startswith(item['linlindes'].rstrip('0')):
            if has_children(item["lincodigo"], items):
                # submenu = {
                #     'lincodigo': item["lincodigo"],
                #     'lindescri': item['lindescri'],
                #     'linlindes': item['linlindes'],
                #     'linnivel': item['linnivel'],
                #     'lintipo': item['lintipo'],
                #     'linstatus': item['linstatus'],
                #     'children': build_tree(items, item['lincodigo1'])
                # }
                item["children"] = build_tree(items, item["lincodigo"])
                children.append(item)
            else:
                # hoja = {
                #     'lincodigo': item["lincodigo"],
                #     'lindescri': item['lindescri'],
                #     'linlindes': item['linlindes'],
                #     'linnivel': item['linnivel'],
                #     'lintipo': item['lintipo'],
                #     'linstatus': item['linstatus'],
                # }
                children.append(item)
    return children

    # items = []
    # for item in results:
    #     items.append({
    #         'lincodigo': item[0],
    #         'lindescri': item[1],
    #         'linlindes': item[2],
    #         'linnivel': item[3],
    #         'lintipo': item[4],
    #         'linstatus': item[5],
    # })

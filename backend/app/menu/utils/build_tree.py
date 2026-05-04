# flake8: noqa


def has_children(item_number, items):
    for item in items:
        if item["padre_id"] == item_number:
            return True
    return False


def build_tree(items, parent_id=None):
    children = []
    for item in items:
        if item["padre_id"] == parent_id:
            if has_children(item["item_number"], items):
                submenu = {
                    "link": f'dashboard/{item["opccontroller"]}',
                    "item_number": item["item_number"],
                    "label": item["opccaption"],
                    "icon": item["opcicono"],
                    "type": "submenu",
                    "submenu": build_tree(items, item["item_number"]),
                    "opcmenu": item["opcmenu"],
                    "opctag": item["opctag"],
                    "opccontroller": item["opccontroller"],
                }
                children.append(submenu)
            else:
                link = {
                    "link": f'dashboard/{item["opccontroller"]}',
                    "label": item["opccaption"],
                    "icon": item["opcicono"],
                    "type": "link",
                    "component": item["opccaption"],
                    "opcmenu": item["opcmenu"],
                    "opctag": item["opctag"],
                    "opccontroller": item["opccontroller"],
                }
                children.append(link)
    return children

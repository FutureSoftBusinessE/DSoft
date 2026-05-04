from enum import Enum

# Este enum se usa para saber el tipo de valor que es un campo o column pasado desde la web
# al momento de filtrar su valor en una tabla con varias columnas, ej: getAllCitas


class FILTER_VALUE_TYPE(Enum):
    STRING = "string"
    DATETIME = "datetime"
    NUMBER = "number"
    ENCRYPTED = "ENCRYPTED"

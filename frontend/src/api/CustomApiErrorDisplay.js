// components/NewApiErrorDisplay.jsx
import React, { useState } from "react"
import { notificationService } from "./notificationService"

export const CustomApiErrorDisplay = ({
  error,
  showCopyButton = true,
  defaultExpanded = false,
  showTimestamp = true,
  showErrorCode = true,
  showEndpoint = true,
  showCloseButton = true, // NUEVO: mostrar botón de cerrar
  onClose, // NUEVO: callback al cerrar
  autoCloseAfter, // NUEVO: auto-cerrar después de X segundos
  className = "",
  ...restProps
}) => {
  // Solo mostrar para APIs nuevas con request_id
  if (!error?.requestId || error.requestId === "unknown") {
    return null
  }

  // Estado para controlar si el accordion está expandido
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  // NUEVO: Estado para controlar si el componente está visible
  const [isVisible, setIsVisible] = useState(true)

  // Colores empresariales profesionales
  const colors = {
    background: "#f8fafc",
    border: "#e2e8f0",
    text: "#334155",
    label: "#64748b",
    codeBackground: "#f1f5f9",
    codeBorder: "#cbd5e1",
    primary: "#0f766e",
    primaryHover: "#115e59",
    icon: "#0d9488",
    accordionHeader: "#f1f5f9",
    accordionBorder: "#e2e8f0",
    danger: "#dc2626", // Rojo para botón de cerrar
    dangerHover: "#b91c1c",
    warning: "#d97706", // Amarillo para auto-close
  }

  // NUEVO: Efecto para auto-cerrar
  React.useEffect(() => {
    if (autoCloseAfter && isVisible) {
      const timer = setTimeout(() => {
        handleClose()
      }, autoCloseAfter * 1000)

      return () => clearTimeout(timer)
    }
  }, [autoCloseAfter, isVisible])

  const handleCopy = () => {
    notificationService.copyRequestIdToClipboard(error.requestId)
  }

  // NUEVO: Función para cerrar/eliminar el error
  const handleClose = () => {
    setIsVisible(false)
    if (onClose) {
      onClose(error)
    }
  }

  // NUEVO: Si no está visible, no renderizar nada
  if (!isVisible) {
    return null
  }

  // Extraer información del error
  const timestamp = error.timestamp || error.metadata?.timestamp
  const errorCode = error.code || error.metadata?.error_code
  const endpoint = error.path || error.metadata?.path
  const errorType = error.type || error.metadata?.error_type
  const errorDetails = error.details || error.metadata?.details

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        overflow: "hidden",
        margin: "12px 0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        position: "relative", // Para posicionar el botón de cerrar
        animation: "slideIn 0.3s ease", // Animación de entrada
      }}
      className={className}
      {...restProps}
    >
      {/* NUEVO: Botón de cerrar en esquina superior derecha */}
      {showCloseButton && (
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "transparent",
            border: "none",
            color: colors.label,
            cursor: "pointer",
            fontSize: "16px",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "all 0.2s ease",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2"
            e.currentTarget.style.color = colors.danger
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = colors.label
          }}
          aria-label="Cerrar mensaje de error"
          title="Cerrar"
        >
          ×
        </button>
      )}

      {/* NUEVO: Indicador de auto-cierre */}
      {autoCloseAfter && (
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "2px",
            background: colors.warning,
            animation: `shrink ${autoCloseAfter}s linear forwards`,
          }}
        />
      )}

      {/* HEADER DEL ACCORDION */}
      <div
        style={{
          background: colors.accordionHeader,
          padding: "12px 16px",
          paddingRight: showCloseButton ? "40px" : "16px", // Espacio para botón cerrar
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: isExpanded ? `1px solid ${colors.accordionBorder}` : "none",
          transition: "all 0.2s ease",
          minHeight: "44px", // Altura mínima para mejor click
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyPress={(e) => e.key === "Enter" && setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <div
            style={{
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
              fontSize: "12px",
              color: colors.icon,
              flexShrink: 0,
            }}
          >
            ▶
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {" "}
            {/* Para truncar texto largo */}
            <div
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: colors.text,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ color: colors.icon, flexShrink: 0 }}>🔄</span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                ID de Error
              </span>
            </div>
            <div
              style={{
                fontFamily: "'SF Mono', Monaco, monospace",
                fontSize: "12px",
                color: colors.primary,
                marginTop: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {error.requestId}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
            marginLeft: "10px",
          }}
        >
          {/* Botón de copiar en el header */}
          {showCopyButton && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCopy()
              }}
              style={{
                background: colors.primary,
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.primaryHover
                e.currentTarget.style.transform = "translateY(-1px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.primary
                e.currentTarget.style.transform = "translateY(0)"
              }}
              aria-label="Copiar ID de error"
            >
              📋 Copiar
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO DEL ACCORDION */}
      {isExpanded && (
        <div
          style={{
            padding: "16px",
            background: "white",
            animation: "fadeIn 0.3s ease",
            paddingRight: showCloseButton ? "40px" : "16px", // Espacio para botón cerrar
          }}
        >
          {/* Información básica del error */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: colors.text,
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ color: colors.icon }}>⚠️</span>
              Información del Error
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                fontSize: "13px",
              }}
            >
              {/* Mensaje del error */}
              {error.message && (
                <div>
                  <div style={{ color: colors.label, fontSize: "11px", marginBottom: "2px" }}>Mensaje</div>
                  <div style={{ color: colors.text, wordBreak: "break-word" }}>{error.message}</div>
                </div>
              )}

              {/* Tipo de error */}
              {errorType && showErrorCode && (
                <div>
                  <div style={{ color: colors.label, fontSize: "11px", marginBottom: "2px" }}>Tipo</div>
                  <div
                    style={{
                      color: colors.text,
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  >
                    {errorType}
                  </div>
                </div>
              )}

              {/* Código de error */}
              {errorCode && showErrorCode && (
                <div>
                  <div style={{ color: colors.label, fontSize: "11px", marginBottom: "2px" }}>Código</div>
                  <div
                    style={{
                      color: colors.text,
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  >
                    {errorCode}
                  </div>
                </div>
              )}

              {/* Endpoint */}
              {endpoint && showEndpoint && (
                <div>
                  <div style={{ color: colors.label, fontSize: "11px", marginBottom: "2px" }}>Endpoint</div>
                  <div
                    style={{
                      color: colors.text,
                      fontFamily: "monospace",
                      fontSize: "12px",
                      wordBreak: "break-all",
                    }}
                  >
                    {endpoint}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              {timestamp && showTimestamp && (
                <div>
                  <div style={{ color: colors.label, fontSize: "11px", marginBottom: "2px" }}>Fecha/Hora</div>
                  <div style={{ color: colors.text, fontSize: "12px" }}>{new Date(timestamp).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Detalles específicos */}
          {errorDetails && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ color: colors.icon }}>📋</span>
                Detalles Adicionales
              </div>

              <div
                style={{
                  background: colors.codeBackground,
                  border: `1px solid ${colors.codeBorder}`,
                  borderRadius: "6px",
                  padding: "12px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    fontFamily: "'SF Mono', Monaco, monospace",
                    color: colors.text,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {typeof errorDetails === "object" ? JSON.stringify(errorDetails, null, 2) : errorDetails}
                </pre>
              </div>
            </div>
          )}

          {/* NUEVO: Barra de acciones en la parte inferior */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            {/* Instrucciones */}
            <div
              style={{
                fontSize: "12px",
                color: colors.text,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: colors.primary }}>💡</span>
              <span>Proporciona este ID al equipo de soporte</span>
            </div>
          </div>
        </div>
      )}

      {/* Estilos de animación */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }

          /* Mejoras de accesibilidad */
          [role="button"]:focus {
            outline: 2px solid ${colors.primary};
            outline-offset: 2px;
          }

          pre::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          pre::-webkit-scrollbar-track {
            background: ${colors.codeBackground};
            border-radius: 3px;
          }

          pre::-webkit-scrollbar-thumb {
            background: ${colors.border};
            border-radius: 3px;
          }

          pre::-webkit-scrollbar-thumb:hover {
            background: ${colors.label};
          }
        `}
      </style>
    </div>
  )
}

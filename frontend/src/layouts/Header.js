import React, { useState } from "react"
import { Link } from "react-router-dom"
import Dropdown from "react-bootstrap/Dropdown"
import { Button, Modal, Form, Spinner } from "react-bootstrap"
import userAvatar from "../assets/img/logo-sm.png"
import useCleanSession from "../hooks/cleanSession"
import ProductNotifications from "../components/ProductNotifications"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import Swal from "sweetalert2"

export default function Header({ onSkin }) {
  const cleanSession = useCleanSession()

  // ---- ESTADOS PARA EL SWITCH DE COMPAÑÍA ----
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [companies, setCompanies] = useState([])
  const [locations, setLocations] = useState([])

  const [selectedCia, setSelectedCia] = useState(null)
  const [selectedLoc, setSelectedLoc] = useState("")

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <Link
      to=""
      ref={ref}
      onClick={(e) => {
        e.preventDefault()
        onClick(e)
      }}
      className="dropdown-link"
    >
      {children}
    </Link>
  ))

  const toggleSidebar = (e) => {
    e.preventDefault()
    const isOffset = document.body.classList.contains("sidebar-offset")
    if (isOffset) {
      document.body.classList.toggle("sidebar-show")
    } else {
      if (window.matchMedia("(max-width: 991px)").matches) {
        document.body.classList.toggle("sidebar-show")
      } else {
        document.body.classList.toggle("sidebar-hide")
      }
    }
  }

  // ---- FUNCIONES DEL SWITCH DE COMPAÑÍA ----
  const handleOpenSwitchModal = async () => {
    setShowSwitchModal(true)
    setIsLoading(true)
    try {
      const user = localStorage.getItem("cliciausu")
      const grupo = localStorage.getItem("cliciagrupo")

      const res = await fetchwrapper("/login/companias_del_usuarioSinGrupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // <--- CABECERA AÑADIDA
        body: JSON.stringify({ cliciausu: user, cliciagrupo: grupo }),
      })
      const responseData = await res.json()

      if (responseData.status === "ok") {
        setCompanies(responseData.data)
      }
    } catch (error) {
      Swal.fire("Error", "No se pudieron cargar las compañías disponibles.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanyChange = async (e) => {
    const [cliciaidenti, ciaCodigo] = e.target.value.split("_")
    const ciaObj = companies.find((c) => c.cliciaidenti === cliciaidenti && c.cliciaciacodigo === ciaCodigo)
    setSelectedCia({ ...ciaObj, idCb: e.target.value })
    setSelectedLoc("")
    setLocations([])

    if (!ciaObj) return

    setIsLoading(true)
    try {
      const user = localStorage.getItem("cliciausu")
      const res = await fetchwrapper("/login/get_localidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // <--- CABECERA AÑADIDA
        body: JSON.stringify({ user, seleccion: ciaObj }),
      })
      const data = await res.json()
      setLocations(data)

      // REGLA DE NEGOCIO: Si solo hay 1 localidad, autoseleccionar
      if (data && data.length === 1) {
        setSelectedLoc(data[0].loccodigo)
      }
    } catch (error) {
      Swal.fire("Error", "No se pudieron cargar las localidades.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const confirmSwitchCompany = async () => {
    if (!selectedCia || !selectedLoc) {
      return Swal.fire("Atención", "Debe seleccionar una compañía y una localidad.", "warning")
    }

    setIsLoading(true)
    try {
      const user = localStorage.getItem("cliciausu")
      const locObj = locations.find((l) => l.loccodigo === selectedLoc)

      // 1. Obtener el nuevo Token (Sin pedir clave)
      const resToken = await fetchwrapper("/login/switch_company_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // <--- CABECERA AÑADIDA
        body: JSON.stringify({
          user,
          seleccion: selectedCia,
          localidad: locObj,
        }),
      })
      const dataToken = await resToken.json()

      if (dataToken.status === "ok") {
        // 2. Actualizamos el localstorage y accesstoken con la nueva identidad
        localStorage.setItem("jwt", JSON.stringify(dataToken.data))
        localStorage.setItem("token", dataToken.token)
        localStorage.setItem("accessToken", JSON.stringify(dataToken.token))

        // Limpiamos el caché del menú viejo
        localStorage.removeItem("menuAcciones")

        // 3. Obtener el nuevo menú correspondiente a la nueva compañía
        // (Ajuste el endpoint si en su proyecto la ruta es diferente)
        const resMenu = await fetchwrapper("/menu/get_menu_opciones_acciones", { method: "GET" })
        const dataMenu = await resMenu.json()
        localStorage.setItem("menuAcciones", JSON.stringify(dataMenu.data || dataMenu))

        // 4. "Hard Reload" para limpiar toda la memoria RAM/Context de React y aplicar los cambios
        // Usamos reload() para que se quede en la misma pantalla (o cambie a la ruta de su dashboard si prefiere)
        window.location.reload()

        // NOTA: Si al recargar la página actual le da problemas porque la nueva compañía no tiene
        // permisos para esa pantalla, use la ruta base de su dashboard, por ejemplo:
        // window.location.href = "/home/dashboard";
      } else {
        Swal.fire("Error", dataToken.message || "No se pudo realizar el cambio.", "error")
      }
    } catch (error) {
      console.error(error)
      Swal.fire("Error", "Ocurrió un error inesperado al cambiar de entorno.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Resto de lógicas visuales (Skin, Sidebar)...
  const skinMode = (e) => {
    e.preventDefault()
    e.target.classList.add("active")
    let node = e.target.parentNode.firstChild
    while (node) {
      if (node !== e.target && node.nodeType === Node.ELEMENT_NODE) node.classList.remove("active")
      node = node.nextElementSibling || node.nextSibling
    }
    const skin = e.target.textContent.toLowerCase()
    const HTMLTag = document.querySelector("html")
    if (skin === "dark") {
      HTMLTag.setAttribute("data-skin", skin)
      localStorage.setItem("skin-mode", skin)
      onSkin(skin)
    } else {
      HTMLTag.removeAttribute("data-skin")
      localStorage.removeItem("skin-mode")
      onSkin("")
    }
  }

  const sidebarSkin = (e) => {
    e.preventDefault()
    e.target.classList.add("active")
    let node = e.target.parentNode.firstChild
    while (node) {
      if (node !== e.target && node.nodeType === Node.ELEMENT_NODE) node.classList.remove("active")
      node = node.nextElementSibling || node.nextSibling
    }
    const skin = e.target.textContent.toLowerCase()
    const HTMLTag = document.querySelector("html")
    HTMLTag.removeAttribute("data-sidebar")
    if (skin !== "default") {
      HTMLTag.setAttribute("data-sidebar", skin)
      localStorage.setItem("sidebar-skin", skin)
    } else {
      localStorage.removeItem("sidebar-skin", skin)
    }
  }

  return (
    <>
      <div className="header-main px-3 px-lg-4">
        <Link onClick={toggleSidebar} className="menu-link me-3 me-lg-4">
          <i className="ri-menu-2-fill"></i>
        </Link>

        <div className="form-search me-auto">
          <input type="text" className="form-control" placeholder="Search" />
          <i className="ri-search-line"></i>
        </div>

        <ProductNotifications />
        <Dropdown className="dropdown-skin" align="end">
          <Dropdown.Toggle as={CustomToggle}>
            <i className="ri-settings-3-line"></i>
          </Dropdown.Toggle>
          <Dropdown.Menu className="mt-10-f">
            <label>Skin Mode</label>
            <nav className="nav nav-skin">
              <Link onClick={skinMode} className={localStorage.getItem("skin-mode") ? "nav-link" : "nav-link active"}>
                Light
              </Link>
              <Link onClick={skinMode} className={localStorage.getItem("skin-mode") ? "nav-link active" : "nav-link"}>
                Dark
              </Link>
            </nav>
            <hr />
            <label>Sidebar Skin</label>
            <nav id="sidebarSkin" className="nav nav-skin">
              <Link
                onClick={sidebarSkin}
                className={!localStorage.getItem("sidebar-skin") ? "nav-link active" : "nav-link"}
              >
                Default
              </Link>
              <Link
                onClick={sidebarSkin}
                className={localStorage.getItem("sidebar-skin") === "prime" ? "nav-link active" : "nav-link"}
              >
                Prime
              </Link>
              <Link
                onClick={sidebarSkin}
                className={localStorage.getItem("sidebar-skin") === "dark" ? "nav-link active" : "nav-link"}
              >
                Dark
              </Link>
            </nav>
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown className="dropdown-profile ms-3 ms-xl-4" align="end">
          <Dropdown.Toggle as={CustomToggle}>
            <div className="avatar online">
              <img src={userAvatar} alt="" />
            </div>
          </Dropdown.Toggle>
          <Dropdown.Menu className="mt-10-f">
            <div className="dropdown-menu-body">
              <div className="avatar avatar-xl online mb-3">
                <img src={userAvatar} alt="" />
              </div>
              <h5 className="mb-1 text-dark fw-semibold">{localStorage.getItem("cliciausu")}</h5>
              <p className="fs-sm text-secondary" style={{ marginBottom: "5px" }}>
                {JSON.parse(localStorage.getItem("jwt")).seleccion.cliciacianombre}
              </p>
              <p className="fs-sm text-secondary">{JSON.parse(localStorage.getItem("jwt")).localidad.locdescri}</p>

              <hr />
              <nav className="nav">
                {/* NUEVO BOTÓN PARA CAMBIO DE COMPAÑÍA */}
                <Button
                  variant="link"
                  onClick={handleOpenSwitchModal}
                  style={{
                    textAlign: "left",
                    paddingLeft: 0,
                    textDecoration: "none",
                    color: "#4f5d73",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <i className="ri-exchange-box-line" style={{ fontSize: "1.2rem" }}></i> Cambiar Entorno
                </Button>

                <Button
                  onClick={() => {
                    if (window.confirm("¿Desea cerrar sesión?")) {
                      cleanSession()
                    }
                  }}
                >
                  <i className="ri-logout-box-r-line"></i> Log Out
                </Button>
              </nav>
            </div>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* ---- MODAL PARA CAMBIAR COMPAÑÍA / LOCALIDAD ---- */}
      <Modal show={showSwitchModal} onHide={() => !isLoading && setShowSwitchModal(false)} centered backdrop="static">
        <Modal.Header closeButton={!isLoading}>
          <Modal.Title>
            <i className="ri-building-4-line"></i> Cambiar Compañía / Localidad
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Procesando...</p>
            </div>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Compañía</Form.Label>
                <Form.Select onChange={handleCompanyChange} value={selectedCia?.idCb || ""}>
                  <option value="">-- Seleccione Compañía --</option>
                  {companies.map((cia) => (
                    <option
                      key={cia.cliciaidenti + "_" + cia.cliciaciacodigo}
                      value={cia.cliciaidenti + "_" + cia.cliciaciacodigo}
                    >
                      {cia.cliciaidenti} - {cia.cliciaciacodigo} - {cia.cliciacianombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Localidad</Form.Label>
                <Form.Select
                  disabled={locations.length === 0}
                  value={selectedLoc}
                  onChange={(e) => setSelectedLoc(e.target.value)}
                >
                  <option value="">-- Seleccione Localidad --</option>
                  {locations.map((loc) => (
                    <option key={loc.loccodigo} value={loc.loccodigo}>
                      {loc.locdescri}
                    </option>
                  ))}
                </Form.Select>
                {locations.length === 1 && (
                  <Form.Text className="text-success">
                    <i className="ri-check-line"></i> Única localidad disponible autoseleccionada.
                  </Form.Text>
                )}
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSwitchModal(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={confirmSwitchCompany} disabled={isLoading || !selectedCia || !selectedLoc}>
            Confirmar y Cambiar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

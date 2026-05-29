/* eslint-disable no-prototype-builtins */
import React, { Component } from "react"
import { Link, NavLink } from "react-router-dom"
import PerfectScrollbar from "react-perfect-scrollbar"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import * as Icons from "react-icons/fc"
import getIconComponent from "../helpers/getIconComponentMenu"

class SidebarMenu extends Component {
  state = {
    menu: [],
  }

  componentDidMount() {
    this.fetchAndSetMenu(false) // Carga inicial
  }

  // Función asíncrona para traer y verificar el menú desde API
  fetchAndSetMenu = async (silentVerify = false) => {
    try {
      let response = await fetchwrapper("/menu/get_menu_all")
      if (!response.ok) throw new Error("Fallo en red")
      response = await response.json()

      const currentMenuString = localStorage.getItem("menu")
      const newMenuString = JSON.stringify({ menu: response.items })

      // Si es una verificación en segundo plano (clic) y los menús son idénticos, no re-dibuja para ahorrar recursos
      if (silentVerify && currentMenuString === newMenuString) {
        return
      }

      localStorage.setItem("menu", newMenuString)
      this.calculateTotalNiveles(response.items)

      this.setState({
        menu: response.items,
      })
    } catch (err) {
      console.error("Error cargando menú: ", err)
    }
  }

  // Disparador de seguridad al hacer clic en cualquier parte de la barra
  handleMenuInteraction = () => {
    // Llama al fetch en background para verificar cambios de permisos en tiempo real
    this.fetchAndSetMenu(true)
  }

  totalNivelesParent = (arr, depth = 1) => {
    let maxDepth = depth
    for (const item of arr) {
      if (item.hasOwnProperty("submenu") && Array.isArray(item.submenu)) {
        const subDepth = this.totalNivelesParent(item.submenu, depth + 1)
        if (subDepth > maxDepth) maxDepth = subDepth
      }
    }
    return maxDepth
  }

  calculateTotalNiveles = (menu) => {
    const newMenu = menu.map((option) => ({
      ...option,
      totalNiveles: this.totalNivelesParent([option]),
    }))
    localStorage.setItem("menu", JSON.stringify({ menu: newMenu }))
  }

  // -------------------------------------------------------------
  // DIBUJANTE 0: MENÚ ACTUAL (ESTÁNDAR DE SISTEMA)
  // -------------------------------------------------------------
  populateMenuOriginal = (menu = []) => {
    const navsGroup = []
    for (const option of menu) {
      if (option.totalNiveles === 1) {
        const icon = getIconComponent(option)
        navsGroup.push(
          <div className="nav-group" key={option.item_number}>
            <NavLink to={option.link} className="nav-sub-link">
              <div className="nav-label">
                {icon}
                {option.label}
              </div>
            </NavLink>
          </div>,
        )
      }
      if (option.totalNiveles === 2) {
        const icon = getIconComponent(option)
        const subNavLabels = option.submenu.map((sub) => {
          const subIcon = getIconComponent(sub)
          return (
            <li className="nav-item" key={sub.item_number}>
              <NavLink to={sub.link} className="nav-sub-link">
                <i>{subIcon}</i>
                <span>{sub.label}</span>
              </NavLink>
            </li>
          )
        })
        navsGroup.push(
          <div className="nav-group show" onClick={this.toggleMenuOriginal} key={option.item_number}>
            <div className="nav-label ">
              {icon}
              {option.label}
            </div>
            <ul className="nav nav-sidebar">{subNavLabels}</ul>
          </div>,
        )
      }
      if (option.totalNiveles === 3) {
        const icon = getIconComponent(option)
        navsGroup.push(
          <div className="nav-group" key={option.item_number}>
            <NavLink to={`Submenu/${option.label}/${option.item_number}`} className="nav-sub-link">
              <div className="nav-label">
                {icon}
                {option.label}
              </div>
            </NavLink>
          </div>,
        )
      }
      if (option.totalNiveles === 4) {
        const icon = getIconComponent(option)
        const subNavLabels = option.submenu.map((sub) => {
          const subIcon = getIconComponent(sub)
          return (
            <li className="nav-item" key={sub.item_number}>
              <NavLink to={`Submenu/${sub.label}/${sub.item_number}`} className="nav-sub-link">
                <i>{subIcon}</i>
                <span>{sub.label}</span>
              </NavLink>
            </li>
          )
        })
        navsGroup.push(
          <div className="nav-group show" onClick={this.toggleMenuOriginal} key={option.item_number}>
            <div className="nav-label ">
              {icon}
              {option.label}
            </div>
            <ul className="nav nav-sidebar">{subNavLabels}</ul>
          </div>,
        )
      }
    }
    return navsGroup
  }

  toggleMenuOriginal = (e) => {
    e.preventDefault()
    const parent = e.target.closest(".nav-group")
    if (parent) parent.classList.toggle("show")
    this.props.onUpdateSize()
  }

  // -------------------------------------------------------------
  // DIBUJANTE 1: NUEVO MENÚ TIPO ÁRBOL (RECURSIVO)
  // -------------------------------------------------------------
  populateMenuTree = (menuArr = [], depth = 0) => {
    return menuArr.map((option) => {
      const icon = getIconComponent(option)
      const hasSubmenu = option.submenu && option.submenu.length > 0
      const paddingLeft = depth === 0 ? "10px" : "25px" // Escalonado visual

      if (hasSubmenu) {
        // Usamos la etiqueta <details> nativa de HTML que funciona como árbol desplegable
        return (
          <details key={option.item_number} style={{ marginBottom: "5px", paddingLeft, width: "100%" }}>
            <summary
              className="nav-label"
              style={{
                cursor: "pointer",
                padding: "8px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                listStyle: "none",
              }}
            >
              {icon} <span>{option.label}</span>
              <span style={{ marginLeft: "auto", fontSize: "0.8em" }}>▼</span>
            </summary>
            <div style={{ borderLeft: "1px dashed rgba(0,0,0,0.2)", marginLeft: "15px", marginTop: "5px" }}>
              {this.populateMenuTree(option.submenu, depth + 1)}
            </div>
          </details>
        )
      } else {
        // Opción final de enlace
        const linkTo = option.link || `Submenu/${option.label}/${option.item_number}`
        return (
          <div key={option.item_number} style={{ padding: "6px 8px", paddingLeft }}>
            <NavLink
              to={linkTo}
              className="nav-sub-link"
              style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
            >
              {icon} <span>{option.label}</span>
            </NavLink>
          </div>
        )
      }
    })
  }

  render() {
    let menuComponent = null
    const rawMenu = localStorage.getItem("menu")

    // Leemos el tipo de menú de memoria, si no hay, asume 0
    const tipoMenu = parseInt(localStorage.getItem("ciatipomenu") || 0)

    if (rawMenu) {
      const menuData = JSON.parse(rawMenu)?.menu
      if (tipoMenu === 1) {
        menuComponent = (
          <div className="tree-menu-container" style={{ paddingRight: "10px" }}>
            {this.populateMenuTree(menuData)}
          </div>
        )
      } else {
        menuComponent = this.populateMenuOriginal(menuData)
      }
    }

    return (
      <React.Fragment>
        <div onClick={this.handleMenuInteraction} style={{ width: "100%", height: "100%" }}>
          {menuComponent}
        </div>
      </React.Fragment>
    )
  }
}

// Global Event Listeners
window.addEventListener("click", function (e) {
  const tar = e.target
  const sidebar = document.querySelector(".sidebar")
  if (!tar.closest(".sidebar-footer") && sidebar) {
    sidebar.classList.remove("footer-menu-show")
  }
  if (!tar.closest(".sidebar") && !tar.closest(".menu-link")) {
    document.querySelector("body").classList.remove("sidebar-show")
  }
})

window.addEventListener("load", function () {
  const skinMode = localStorage.getItem("sidebar-skin")
  const HTMLTag = document.querySelector("html")
  if (skinMode) {
    HTMLTag.setAttribute("data-sidebar", skinMode)
  }
})

export default class Sidebar extends Component {
  render() {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo" style={{ marginTop: "8px", fontWeight: "bold" }}>
            {JSON.parse(localStorage.getItem("jwt")).seleccion.cliciacianombre}
          </h1>
        </div>
        <PerfectScrollbar className="sidebar-body" ref={(ref) => (this._scrollBarRef = ref)}>
          <SidebarMenu onUpdateSize={() => this._scrollBarRef.updateScroll()} />
        </PerfectScrollbar>
      </div>
    )
  }
}

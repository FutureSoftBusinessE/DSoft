import React, { Component } from "react"
import { Link, NavLink } from "react-router-dom"
import PerfectScrollbar from "react-perfect-scrollbar"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import userAvatar from "../assets/img/logo-sm.png"
import * as Icons from "react-icons/fc"
import getIconComponent from "../helpers/getIconComponentMenu"

class SidebarMenu extends Component {
  state = {
    menu: [],
  }

  async componentDidMount() {
    try {
      let response = await fetchwrapper("/menu/get_menu_all")
      if (!response.ok) {
        throw new Error(response)
      }
      response = await response.json()

      localStorage.setItem("menu", JSON.stringify({ menu: response.items }))
      this.calculateTotalNiveles(response.items)

      this.setState({
        menu: response.items,
      })
    } catch (err) {
      console.error(err)
      console.error(err.message)
    }
  }

  totalNivelesParent = (arr, depth = 1) => {
    // Inicializa una variable para rastrear la profundidad máxima
    let maxDepth = depth

    // Recorre los elementos del array
    for (const item of arr) {
      // Verifica si el elemento tiene la propiedad "prop" y es un array
      // eslint-disable-next-line no-prototype-builtins
      if (item.hasOwnProperty("submenu") && Array.isArray(item.submenu)) {
        // Llama recursivamente a la función para el subarray "prop" y aumenta la profundidad
        const subDepth = this.totalNivelesParent(item.submenu, depth + 1)

        // Actualiza la profundidad máxima si es mayor que la actual
        if (subDepth > maxDepth) {
          maxDepth = subDepth
        }
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


  // Solo existiran maximo 4 niveles en el menu
  populateMenu = (menu = []) => {
    const navsGroup = []

    for (const option of menu) {
      console.log(option)
      if (option.totalNiveles === 1) {
        const icon = getIconComponent(option)
        const nav = (
          <div className="nav-group" key={option.item_number}>
            <NavLink to={option.link} className="nav-sub-link">
              <div className="nav-label">
                {icon}
                {option.label}
              </div>
            </NavLink>
          </div>
        )

        navsGroup.push(nav)
      }

      if (option.totalNiveles === 2) {
        const icon = getIconComponent(option)
        const subNavLabels = option.submenu.map((sub) => {
          // const subIcon = React.createElement(Icons[sub.icon], { size: 30 })
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

        const nav = (
          <div className="nav-group show" onClick={this.toggleMenu} key={option.item_number}>
            <div className="nav-label ">
              {icon}
              {option.label}
            </div>
            <ul className="nav nav-sidebar">{subNavLabels}</ul>
          </div>
        )
        navsGroup.push(nav)
      }
      if (option.totalNiveles === 3) {
        const icon = getIconComponent(option)
        const nav = (
          <div className="nav-group" key={option.item_number}>
            <NavLink to={`Submenu/${option.label}/${option.item_number}`} className="nav-sub-link">
              <div className="nav-label">
                {icon}
                {option.label}
              </div>
            </NavLink>
          </div>
        )

        navsGroup.push(nav)
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

        const nav = (
          <div className="nav-group show" onClick={this.toggleMenu} key={option.item_number}>
            <div className="nav-label ">
              {icon}
              {option.label}
            </div>
            <ul className="nav nav-sidebar">{subNavLabels}</ul>
          </div>
        )
        navsGroup.push(nav)
      }
    }

    console.log(navsGroup, "!!!!!!!!")

    return navsGroup
  }

  // Toggle menu group
  toggleMenu = (e) => {
    e.preventDefault()

    const parent = e.target.closest(".nav-group")
    parent.classList.toggle("show")

    this.props.onUpdateSize()
  }

  // Toggle submenu while closing siblings' submenu
  toggleSubMenu = (e) => {
    e.preventDefault()

    const parent = e.target.closest(".nav-item")
    let node = parent.parentNode.firstChild

    while (node) {
      if (node !== parent && node.nodeType === Node.ELEMENT_NODE) node.classList.remove("show")
      node = node.nextElementSibling || node.nextSibling
    }

    parent.classList.toggle("show")

    this.props.onUpdateSize()
  }

  //aqui dibujo el menu 
  render() {
    let menuComponent = null
    if (localStorage.getItem("menu")) {
      menuComponent = this.populateMenu(JSON.parse(localStorage.getItem("menu"))?.menu)
    }
    return (
      <React.Fragment>
        {menuComponent}
      </React.Fragment>
    )
  }
}

window.addEventListener("click", function (e) {
  // Close sidebar footer menu when clicked outside of it
  const tar = e.target
  const sidebar = document.querySelector(".sidebar")
  if (!tar.closest(".sidebar-footer") && sidebar) {
    sidebar.classList.remove("footer-menu-show")
  }

  // Hide sidebar offset when clicked outside of sidebar
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
  toggleFooterMenu = (e) => {
    e.preventDefault()

    const parent = e.target.closest(".sidebar")
    parent.classList.toggle("footer-menu-show")
  }

  render() {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo" style={{ marginTop: "8px" }}>
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

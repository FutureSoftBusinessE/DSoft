import React from "react"
import Modal from "@mui/material/Modal"

const ImageModal = ({ isOpen, onRequestClose, imageUrl }) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onRequestClose}
    contentLabel="Image Modal"
    className="modal"
    overlayClassName="overlay"
  >
    <button onClick={onRequestClose} className="close-button">
      ×
    </button>
    <img src={imageUrl} alt="Modal Content" className="modal-image" />
  </Modal>
)

export default ImageModal

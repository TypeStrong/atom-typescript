import * as dom from "../../utils/dom"

export class StatusPanel extends HTMLElement {
  createdCallback() {
    this.appendChild(<div className="inline-block ts-status-version">2.2.0-15072987</div>)
    this.appendChild(
      <div
        className="inline-block ts-status-pending">
        <span className="ts-status-pending-count">3</span>
        <span
          className="loading loading-spinner-tiny inline-block"
          style={{marginLeft: 5}}>
        </span>
      </div>
    )
  }

  attachedCallback() {
    console.log("attached")
  }

  attributeChangedCallback() {
    console.log("attrs changed", arguments)
  }

  show() {
    this.style.display = "block"
  }

  hide() {
    this.style.display = "none"
  }

  static create() {
    return document.createElement("ts-status-panel") as StatusPanel
  }
}

(document as any).registerElement('ts-status-panel', StatusPanel)

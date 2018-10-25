import * as etch from "etch"
import {partsToStr} from "../utils"

interface Props extends JSX.Props {
  left: number
  right: number
  top: number
  bottom: number
  sigHelp?: protocol.SignatureHelpItems
}

export class TooltipView implements JSX.ElementClass {
  public readonly element!: HTMLDivElement
  public props: Props

  constructor() {
    this.props = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    }
    etch.initialize(this)
  }

  public async destroy() {
    return etch.destroy(this)
  }

  public async update(props: Partial<Props>) {
    this.props = {...this.props, ...props}
    await etch.update(this)
  }

  public writeAfterUpdate() {
    const offset = 10
    let left = this.props.right
    let right: number | false = false

    let whiteSpace = ""

    const clientWidth = document.body.clientWidth
    const offsetWidth = this.element.offsetWidth
    const offsetHeight = this.element.offsetHeight

    let top = this.props.top - offsetHeight

    // X axis adjust
    if (left + offsetWidth >= clientWidth) {
      left = clientWidth - offsetWidth - offset
    }
    if (left < 0) {
      whiteSpace = "pre-wrap"
      left = offset
      right = offset
    }

    // Y axis adjust
    if (top < 0) {
      top = this.props.bottom
    }

    this.element.style.left = `${left}px`
    this.element.style.top = `${top}px`
    if (right !== false) this.element.style.right = `${right}px`
    if (whiteSpace) this.element.style.whiteSpace = whiteSpace
  }

  public render() {
    return (
      <div class="atom-typescript-tooltip tooltip">
        <div class="tooltip-inner">{this.tooltipContents()}</div>
      </div>
    )
  }

  private tooltipContents() {
    if (!this.props.sigHelp) return "…"
    const {sigHelp} = this.props
    return sigHelp.items.map((sig, idx) => (
      <div
        class={`atom-typescript-tooltip-signature-help${
          idx === sigHelp.selectedItemIndex
            ? " atom-typescript-tooltip-signature-help-selected"
            : ""
        }`}>
        {partsToStr(sig.prefixDisplayParts)}
        {this.renderSigHelpParams(sig.parameters, sigHelp.argumentIndex)}
        {partsToStr(sig.suffixDisplayParts)}
        <div class="atom-typescript-tooltip-signature-help-documentation">
          {partsToStr(sig.documentation)}
        </div>
      </div>
    ))
  }

  private renderSigHelpParams(params: protocol.SignatureHelpParameter[], selIdx: number) {
    return params.map((p, i) => (
      <span class={`atom-typescript-tooltip-signature-help-parameter`}>
        {i > 0 ? ", " : null}
        <span class={i === selIdx ? "atom-typescript-tooltip-signature-help-selected" : undefined}>
          {partsToStr(p.displayParts)}
        </span>
      </span>
    ))
  }
}

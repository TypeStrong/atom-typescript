import * as etch from "etch"

interface Props extends JSX.Props {
  left: number
  right: number
  top: number
  bottom: number
  info?: protocol.QuickInfoResponseBody
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
    let top = this.props.bottom
    let right: number | false = false

    let whiteSpace = ""

    const clientWidth = document.body.clientWidth
    const offsetWidth = this.element.offsetWidth
    const clientHeight = document.body.clientHeight
    const offsetHeight = this.element.offsetHeight

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
    if (top + offsetHeight >= clientHeight) {
      top = this.props.top - offsetHeight
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
    if (!this.props.info) return "…"
    const code = (
      <div class="atom-typescript-tooltip-tooltip-code">{this.props.info.displayString}</div>
    )
    const docs = this.props.info.documentation ? (
      <div class="atom-typescript-tooltip-tooltip-doc">{this.props.info.documentation}</div>
    ) : null
    return [code, docs]
  }
}

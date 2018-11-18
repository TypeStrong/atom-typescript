import * as etch from "etch"
import {adjustElementPosition} from "./util"

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
    adjustElementPosition(
      this.element,
      document.body,
      this.props,
      atom.config.get("atom-typescript").tooltipPosition,
    )
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

import {TextEditorElement} from "atom"
import * as etch from "etch"
import {adjustElementPosition} from "../tooltips/util"
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

  constructor(private parent: TextEditorElement) {
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
      this.parent,
      this.props,
      atom.config.get("atom-typescript").sigHelpPosition,
    )
  }

  public render() {
    return (
      <div class="atom-typescript-tooltip tooltip" key={this.sigHelpHash()}>
        <div class="tooltip-inner">{this.tooltipContents()}</div>
      </div>
    )
  }

  private sigHelpHash() {
    if (!this.props.sigHelp) return undefined
    const {start, end} = this.props.sigHelp.applicableSpan
    return `${start.line}:${start.offset}-${end.line}:${end.offset}`
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

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
  visibleItem?: number
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
    if (
      props.sigHelp?.selectedItemIndex !== undefined &&
      props.sigHelp?.selectedItemIndex !== this.props.sigHelp?.selectedItemIndex
    ) {
      this.props.visibleItem = undefined
    }
    this.props = {...this.props, ...props}
    if (this.props.sigHelp === undefined) {
      this.props.visibleItem = undefined
    } else if (this.props.visibleItem !== undefined) {
      this.props.visibleItem = this.props.visibleItem % this.props.sigHelp.items.length
      if (this.props.visibleItem < 0) this.props.visibleItem += this.props.sigHelp.items.length
    }
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
      <div className="atom-typescript-tooltip tooltip" key={this.sigHelpHash()}>
        <div className="tooltip-inner">{this.tooltipContents()}</div>
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
    const visibleItem =
      this.props.visibleItem !== undefined ? this.props.visibleItem : sigHelp.selectedItemIndex
    const count = sigHelp.items.length
    const classes = ["atom-typescript-tooltip-signature-help"]
    if (count > 1) {
      classes.push("atom-typescript-tooltip-signature-help-changable")
    }
    function className(idx: number) {
      const newclasses = []
      if (idx === sigHelp.selectedItemIndex) {
        newclasses.push("atom-typescript-tooltip-signature-help-selected")
      }
      if (idx === visibleItem) {
        newclasses.push("atom-typescript-tooltip-signature-help-visible")
      }
      return [...classes, ...newclasses].join(" ")
    }
    return sigHelp.items.map((sig, idx) => (
      <div className={className(idx)}>
        <div>
          {partsToStr(sig.prefixDisplayParts)}
          {this.renderSigHelpParams(sig.parameters, sigHelp.argumentIndex)}
          {partsToStr(sig.suffixDisplayParts)}
          <div className="atom-typescript-tooltip-signature-help-documentation">
            {partsToStr(sig.documentation)}
          </div>
        </div>
      </div>
    ))
  }

  private renderSigHelpParams(params: protocol.SignatureHelpParameter[], selIdx: number) {
    return params.map((p, i) => (
      <span className={`atom-typescript-tooltip-signature-help-parameter`}>
        {i > 0 ? ", " : null}
        <span
          className={i === selIdx ? "atom-typescript-tooltip-signature-help-selected" : undefined}>
          {partsToStr(p.displayParts)}
        </span>
      </span>
    ))
  }
}

import {DisposableLike, TooltipPlacement} from "atom"
import * as etch from "etch"

export interface Props extends JSX.Props {
  title?: string | (() => string)
  html?: boolean
  keyBindingCommand?: string
  keyBindingTarget?: HTMLElement
  class?: string
  placement?: TooltipPlacement | (() => TooltipPlacement)
  trigger?: "click" | "hover" | "focus" | "manual"
  delay?: {show: number; hide: number}
}

export class Tooltip implements JSX.ElementClass {
  public props: Props
  public element!: HTMLElement
  private tooltipDisposable: DisposableLike

  constructor(props: Props, private children?: JSX.Element[]) {
    this.props = {
      ...props,
      delay: {show: 0, hide: 0},
    }
    etch.initialize(this)

    this.tooltipDisposable = atom.tooltips.add(this.element, this.props)
  }

  public async update(props: Partial<Props>, children: JSX.Element[]) {
    this.props = {...this.props, ...props}
    this.children = children
    await etch.update(this)
    this.tooltipDisposable.dispose()
    this.tooltipDisposable = atom.tooltips.add(this.element, this.props)
  }

  public render() {
    return <div className="inline-block">{this.children ? this.children : null}</div>
  }

  public async destroy() {
    await etch.destroy(this)
    this.tooltipDisposable.dispose()
  }
}

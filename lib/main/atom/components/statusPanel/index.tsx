import * as etch from "etch"
import {handlePromise} from "../../../../utils"
import {ConfigPath} from "./configPath"
import {BuildStatus} from "./buildStatus"
import {Tooltip} from "./tooltip"

export interface Props extends JSX.Props {
  version?: string
  pending?: string[]
  tsConfigPath?: string
  buildStatus?: {success: true} | {success: false; message: string}
  progress?: {max: number; value: number}
  visible?: boolean
}

export class StatusPanel implements JSX.ElementClass {
  public props: Props

  constructor(props: Props = {}) {
    this.props = {
      visible: true,
      ...props,
    }
    etch.initialize(this)
  }

  public async update(props: Partial<Props>) {
    this.props = {...this.props, ...props}
    await etch.update(this)
  }

  public render() {
    return (
      <ts-status-panel className={this.props.visible ? "" : "hide"}>
        {this.renderVersion()}
        {this.renderPending()}
        {this.renderConfigPath()}
        {this.renderProgress() || this.renderStatus()}
      </ts-status-panel>
    )
  }

  public async destroy() {
    await etch.destroy(this)
  }

  public dispose() {
    handlePromise(this.destroy())
  }

  public async show() {
    await this.update({visible: true})
  }

  public async hide() {
    await this.update({visible: false})
  }

  private renderVersion(): JSX.Element | null {
    if (this.props.version !== undefined) {
      return <Tooltip title="Active TypeScript version">{this.props.version}</Tooltip>
    }
    return null
  }

  private renderPending(): JSX.Element | null {
    if (this.props.pending && this.props.pending.length > 0) {
      return (
        <Tooltip
          title={`Pending Requests: <ul>${this.props.pending
            .map(x => `<li>${x}</li>`)
            .join("")}</ul>`}
          html={true}>
          <span ref="pendingCounter">{this.props.pending.length.toString()}</span>
          <span
            ref="pendingSpinner"
            className="loading loading-spinner-tiny inline-block"
            style={{marginLeft: "5px", opacity: "0.5", verticalAlign: "sub"}}
          />
        </Tooltip>
      )
    } else return null
  }

  private renderConfigPath(): JSX.Element | null {
    if (this.props.tsConfigPath !== undefined) {
      return <ConfigPath tsConfigPath={this.props.tsConfigPath} />
    }
    return null
  }

  private renderStatus(): JSX.Element | null {
    if (this.props.buildStatus) {
      return <BuildStatus buildStatus={this.props.buildStatus} />
    }
    return null
  }

  private renderProgress(): JSX.Element | null {
    if (this.props.progress) {
      return (
        <progress
          style={{verticalAlign: "baseline"}}
          className="inline-block"
          max={this.props.progress.max}
          value={this.props.progress.value}
        />
      )
    }
    return null
  }
}

import * as etch from "etch"
import {dirname} from "path"
import {getFilePathRelativeToAtomProject, openFile} from "../utils"

export interface Props extends JSX.Props {
  version: string | undefined | null
  pending: string[] | undefined | null
  tsConfigPath: string | undefined | null
  buildStatus: {success: boolean} | undefined | null
  progress: {max: number; value: number} | undefined | null
  visible: boolean
}

export class StatusPanel implements JSX.ElementClass {
  private configPath?: string
  private pendingRequests: string[]
  public props: Props

  constructor(props: Partial<Props> = {}) {
    this.props = {
      version: props.version,
      pending: props.pending,
      tsConfigPath: props.tsConfigPath,
      buildStatus: props.buildStatus,
      progress: props.progress,
      visible: true,
    }
    etch.initialize(this)
  }

  public async update(props: Partial<Props>) {
    for (const k of Object.keys(this.props) as Array<keyof Props>) {
      if (props[k] !== undefined && props[k] !== this.props[k]) {
        this.props[k] = props[k]
      }
    }
    await etch.update(this)
  }

  public render() {
    let version = null
    if (this.props.version) {
      version = (
        <div ref="version" className="inline-block">
          {this.props.version}
        </div>
      )
    }
    let pendingContainer = null
    if (this.props.pending && this.props.pending.length) {
      pendingContainer = (
        <a
          ref="pendingContainer"
          className="inline-block"
          href=""
          on={{
            click: evt => {
              evt.preventDefault()
              this.showPendingRequests()
            },
          }}>
          <span ref="pendingCounter">{this.props.pending.length.toString()}</span>
          <span
            ref="pendingSpinner"
            className="loading loading-spinner-tiny inline-block"
            style={{marginLeft: "5px", opacity: "0.5", verticalAlign: "sub"}}
          />
        </a>
      )
    }
    let configPathContainer = null
    if (this.props.tsConfigPath) {
      configPathContainer = (
        <a
          ref="configPathContainer"
          className="inline-block"
          href=""
          on={{
            click: evt => {
              evt.preventDefault()
              this.openConfigPath()
            },
          }}>
          {this.props.tsConfigPath.startsWith("/dev/null")
            ? "No project"
            : dirname(getFilePathRelativeToAtomProject(this.props.tsConfigPath))}
        </a>
      )
    }
    let statusContainer = null
    if (this.props.buildStatus) {
      let cls: string
      let text: string
      if (this.props.buildStatus.success) {
        cls = "highlight-success"
        text = "Emit Success"
      } else {
        cls = "highlight-error"
        text = "Emit Failed"
      }
      statusContainer = (
        <div ref="statusContainer" className="inline-block">
          <span ref="statusText" class={cls}>
            {text}
          </span>
        </div>
      )
    }
    let progress = null
    if (this.props.progress) {
      progress = (
        <progress
          ref="progress"
          style={{verticalAlign: "baseline"}}
          className="inline-block"
          max={this.props.progress.max}
          value={this.props.progress.value}
        />
      )
    }
    return (
      <ts-status-panel className={this.props.visible ? "" : "hide"}>
        {version}
        {pendingContainer}
        {configPathContainer}
        {statusContainer}
        {progress}
      </ts-status-panel>
    )
  }

  public async destroy() {
    await etch.destroy(this)
  }

  public dispose() {
    this.destroy()
  }

  private openConfigPath() {
    if (this.configPath && !this.configPath.startsWith("/dev/null")) {
      openFile(this.configPath)
    } else {
      atom.notifications.addInfo("No tsconfig for current file")
    }
  }

  private showPendingRequests() {
    if (this.pendingRequests) {
      atom.notifications.addInfo(
        "Pending Requests: <br/> - " + this.pendingRequests.join("<br/> - "),
      )
    }
  }

  public show() {
    this.update({visible: true})
  }

  public hide() {
    this.update({visible: false})
  }
}

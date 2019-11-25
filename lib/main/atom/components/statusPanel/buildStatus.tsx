import {CompositeDisposable} from "atom"
import * as etch from "etch"
import {debounce} from "lodash"
import {handlePromise} from "../../../../utils"
import {Tooltip} from "./tooltip"

export type TBuildStatus = {success: true} | {success: false; message: string}

export interface Props extends JSX.Props {
  buildStatus: TBuildStatus
}

export class BuildStatus implements JSX.ElementClass {
  public props: Props
  private hiddenBuildStatus = false
  private disposables = new CompositeDisposable()
  private hideBuildStatus!: () => void

  constructor(props: Props) {
    this.props = {
      ...props,
    }
    this.setHideBuildStatus(atom.config.get("atom-typescript").buildStatusTimeout)
    this.resetBuildStatusTimeout()
    etch.initialize(this)
    this.disposables.add(
      atom.config.onDidChange("atom-typescript.buildStatusTimeout", ({newValue}) => {
        this.setHideBuildStatus(newValue)
        handlePromise(this.update({}))
      }),
    )
  }

  public async update(props: Partial<Props>) {
    const successStateChanged =
      props.buildStatus !== undefined &&
      props.buildStatus.success !== this.props.buildStatus.success
    this.props = {...this.props, ...props}
    if (successStateChanged) this.resetBuildStatusTimeout()
    await etch.update(this)
  }

  public render() {
    if (this.hiddenBuildStatus) return <span />

    let cls: string
    let text: string
    if (this.props.buildStatus.success) {
      cls = "highlight-success"
      text = "Emit Success"
    } else {
      cls = "highlight-error"
      text = "Emit Failed"
    }
    return (
      <Tooltip
        title={
          this.props.buildStatus.success
            ? "Build was successful"
            : "Build failed; click to show error message"
        }>
        <span className={cls} on={{click: this.buildStatusClicked}}>
          {text}
        </span>
      </Tooltip>
    )
  }

  public async destroy() {
    await etch.destroy(this)
  }

  private buildStatusClicked = () => {
    if (!this.props.buildStatus.success) {
      atom.notifications.addError("Build failed", {
        detail: this.props.buildStatus.message,
        dismissable: true,
      })
    }
  }

  private resetBuildStatusTimeout() {
    this.hiddenBuildStatus = false
    if (this.props.buildStatus.success) {
      this.hideBuildStatus()
    }
  }

  private setHideBuildStatus(value: number) {
    if (value > 0) {
      this.hideBuildStatus = debounce(() => {
        this.hiddenBuildStatus = true
        handlePromise(etch.update(this))
      }, value * 1000)
    } else if (value === 0) {
      this.hideBuildStatus = () => {
        this.hiddenBuildStatus = true
      }
    } else this.hideBuildStatus = () => {}
  }
}

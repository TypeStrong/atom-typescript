import * as etch from "etch"
import {dirname} from "path"
import {handlePromise} from "../../../../utils"
import {Tooltip} from "./tooltip"

export interface Props extends JSX.Props {
  tsConfigPath: string
}

export class ConfigPath implements JSX.ElementClass {
  public props: Props
  public element!: HTMLElement

  constructor(props: Props) {
    this.props = {
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
      <Tooltip
        title={() =>
          this.props.tsConfigPath.startsWith("/dev/null")
            ? "No tsconfig.json"
            : `Click to open ${atom.project.relativize(this.props.tsConfigPath)}`
        }>
        <a
          className="inline-block"
          href=""
          on={{
            click: (evt) => {
              evt.preventDefault()
              this.openConfigPath()
            },
          }}>
          {this.props.tsConfigPath.startsWith("/dev/null")
            ? "No project"
            : dirname(getFilePathRelativeToAtomProject(this.props.tsConfigPath))}
        </a>
      </Tooltip>
    )
  }

  public async destroy() {
    await etch.destroy(this)
  }

  private openConfigPath() {
    if (!this.props.tsConfigPath.startsWith("/dev/null")) {
      handlePromise(atom.workspace.open(this.props.tsConfigPath))
    } else {
      atom.notifications.addInfo("No tsconfig for current file")
    }
  }
}

/**
 * converts "c:\dev\somethin\bar.ts" to "~something\bar".
 */
function getFilePathRelativeToAtomProject(filePath: string) {
  return "~" + atom.project.relativize(filePath)
}

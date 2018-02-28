import * as etch from "etch"
import {QueryMatch} from "./match.d"

export interface Props extends JSX.Props {
  matches: QueryMatch[]
  styleClass?: string
}

export class HighlightComponent implements JSX.ElementClass {
  constructor(public props: Props) {
    etch.initialize(this)
  }

  public async update(props: Partial<Props>) {
    this.props = {...this.props, ...props}
    await etch.update(this)
  }

  public async destroy() {
    await etch.destroy(this)
  }

  public render(): JSX.Element {
    return (
      <div class={this.props.styleClass || ""}>
        {this.props.matches.map(match => <span class={match.type || ""}>{match.text}</span>)}
      </div>
    )
  }
}

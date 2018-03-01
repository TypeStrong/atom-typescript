import * as etch from "etch"
import {QueryMatch} from "./match.d"
import {highlightMatches} from "./utils"

export interface Props extends JSX.Props {
  label: string
  query: string
}

export class HighlightComponent implements JSX.ElementClass {
  private matches: QueryMatch[]
  constructor(public props: Props) {
    this.matches = this.match(this.props)
    etch.initialize(this)
  }

  public async update(props: Partial<Props>) {
    this.props = {...this.props, ...props}
    this.matches = this.match(this.props)
    await etch.update(this)
  }

  public async destroy() {
    await etch.destroy(this)
  }

  public render(): JSX.Element {
    return <span>{this.matches.map(match => <span class={match.type}>{match.text}</span>)}</span>
  }

  private match(props: Props): QueryMatch[] {
    if (props.query) {
      return highlightMatches(props.label, props.query)
    }
    return [{text: props.label}]
  }
}

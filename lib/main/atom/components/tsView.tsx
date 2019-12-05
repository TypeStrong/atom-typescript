import * as etch from "etch"

interface Props extends JSX.Props {
  highlightedText: string
}

export class TsView implements JSX.ElementClass {
  constructor(public props: Props) {
    etch.initialize(this)
  }

  public async update(props: Partial<Props>) {
    this.props = {...this.props, ...props}
    return etch.update(this)
  }

  public render() {
    const style = {
      fontFamily: atom.config.get("editor.fontFamily"),
    }
    return (
      <div className="editor editor-colors" style={style} innerHTML={this.props.highlightedText} />
    )
  }
}

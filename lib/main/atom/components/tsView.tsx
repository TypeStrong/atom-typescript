import highlight = require("atom-highlight")
import * as etch from "etch"

interface Props extends JSX.Props {
  text: string
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
    const html = highlight({
      fileContents: this.props.text,
      scopeName: "source.tsx",
      editorDiv: false,
      wrapCode: false,
      nbsp: false,
      lineDivs: false,
    })
    const style = {
      fontFamily: atom.config.get("editor.fontFamily"),
    }
    return <div class="editor editor-colors" style={style} innerHTML={html} />
  }
}

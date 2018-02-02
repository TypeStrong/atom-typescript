import * as etch from "etch"
import {MiniEditor} from "./miniEditor"

interface Props extends JSX.Props {
  text: string
}

export class TsView implements JSX.ElementClass {
  editorElement: HTMLElement
  private refs: {
    editor: MiniEditor
  }

  constructor(public props: Props) {
    etch.initialize(this)
  }

  public render() {
    return <MiniEditor ref="editor" initialText={this.props.text} grammar="source.tsx" readOnly />
  }

  public async update(props: Props) {
    if (this.props.text !== props.text) {
      this.props.text = props.text
      this.refs.editor.getModel().setText(props.text)
    }
  }
}

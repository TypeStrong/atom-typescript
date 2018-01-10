import {TextEditor, TextEditorElement} from "atom"

interface Props extends JSX.Props {
  initialText: string
  selectAll: boolean
}

export class MiniEditor {
  private model: TextEditor
  public element: TextEditorElement

  constructor(public props: Props) {
    this.model = atom.workspace.buildTextEditor({
      mini: true,
    })
    this.element = atom.views.getView(this.model)
    this.model.setText(props.initialText)
    if (props.selectAll) {
      this.model.selectAll()
    } else {
      this.model.getLastCursor().moveToEndOfScreenLine()
    }
  }

  public async update() {
    this.element = atom.views.getView(this.model)
  }

  public focus() {
    this.element.focus()
  }

  public getModel() {
    return this.model
  }
}

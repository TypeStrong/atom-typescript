import {TextEditor, TextEditorElement} from "atom"

interface Props extends JSX.Props {
  initialText: string
  selectAll?: boolean
  readOnly?: boolean
  grammar?: string
}

export class MiniEditor implements JSX.ElementClass {
  public element: TextEditorElement
  private model: TextEditor

  constructor(public props: Props) {
    this.model = atom.workspace.buildTextEditor({
      mini: true,
      softWrapped: true,
      lineNumberGutterVisible: false,
    })
    this.element = atom.views.getView(this.model)
    this.model.setText(props.initialText)
    if (props.selectAll) {
      this.model.selectAll()
    } else {
      this.model.getLastCursor().moveToEndOfScreenLine()
    }
    this.setReadOnly()
    this.setGrammar()
    this.model.scrollToBufferPosition([0, 0])
  }

  public async update(props: Partial<Props>) {
    this.element = atom.views.getView(this.model)
    this.props = {...this.props, ...props}
    this.setReadOnly()
    this.setGrammar()
  }

  public focus() {
    this.element.focus()
  }

  public getModel() {
    return this.model
  }

  private setReadOnly() {
    this.model.setReadOnly(!!this.props.readOnly)
  }

  private setGrammar() {
    if (this.props.grammar !== undefined) {
      atom.textEditors.setGrammarOverride(this.model, this.props.grammar)
    } else {
      atom.textEditors.clearGrammarOverride(this.model)
    }
  }
}

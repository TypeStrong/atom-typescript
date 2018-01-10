import {TextEditor, TextEditorElement} from "atom"

interface Props extends JSX.Props {
  initialText: string
  selectAll?: boolean
  readOnly?: boolean
  grammar?: string
}

export class MiniEditor implements JSX.ElementClass {
  private model: TextEditor
  public element: TextEditorElement

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
    if (this.props.readOnly) {
      this.element.removeAttribute("tabindex") // make read-only
    } else {
      this.element.setAttribute("tabindex", "-1")
    }
  }

  private setGrammar() {
    if (this.props.grammar) {
      const grammar = atom.grammars.grammarForScopeName(this.props.grammar)
      if (grammar) {
        this.model.setGrammar(grammar)
      }
    }
  }
}

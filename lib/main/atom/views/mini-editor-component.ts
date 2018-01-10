import {TextEditor, TextEditorElement} from "atom"

interface Props extends JSX.Props {
  initialText: string
  selectAll?: boolean
  readOnly?: boolean
  grammar?: string
}

export class MiniEditor {
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
    if (props.readOnly) {
      this.element.removeAttribute("tabindex") // make read-only
    }
    if (props.grammar) {
      const grammar = atom.grammars.grammarForScopeName(props.grammar)
      if (grammar) {
        this.model.setGrammar(grammar)
      }
    }
    this.model.scrollToBufferPosition([0, 0])
  }

  public async update(props: Props) {
    this.element = atom.views.getView(this.model)
    if (this.props.readOnly !== props.readOnly) {
      this.props.readOnly = props.readOnly
      if (props.readOnly) {
        this.element.removeAttribute("tabindex") // make read-only
      } else {
        this.element.setAttribute("tabindex", "-1")
      }
    }
    if (props.grammar && this.props.grammar !== props.grammar) {
      this.props.readOnly = props.readOnly
      const grammar = atom.grammars.grammarForScopeName(props.grammar)
      if (grammar) {
        this.model.setGrammar(grammar)
      }
    }
  }

  public focus() {
    this.element.focus()
  }

  public getModel() {
    return this.model
  }
}

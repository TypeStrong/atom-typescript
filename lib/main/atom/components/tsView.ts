// Some docs
// http://www.html5rocks.com/en/tutorials/webcomponents/customelements/ (look at lifecycle callback methods)
import * as Atom from "atom"

export class TsView extends HTMLElement {
  editorElement: HTMLElement
  editor: Atom.TextEditor
  createdCallback() {
    const preview = this.innerText
    this.innerText = ""

    this.editor = atom.workspace.buildTextEditor({
      lineNumberGutterVisible: false,
      softWrapped: true,
      mini: true,
    })
    const editorElement: HTMLElement = atom.views.getView(this.editor)
    editorElement.removeAttribute("tabindex") // make read-only
    this.editor.setText(preview)
    const grammar = atom.grammars.grammarForScopeName("source.tsx")
    if (grammar) {
      this.editor.setGrammar(grammar)
    }
    this.editor.scrollToBufferPosition([0, 0])

    this.appendChild(editorElement)
  }

  // API
  text(text: string) {
    this.editor.setText(text)
  }
}

document.registerElement("ts-view", TsView)

// Some docs
// http://www.html5rocks.com/en/tutorials/webcomponents/customelements/ (look at lifecycle callback methods)

export class TsView extends HTMLElement {
  editorElement: HTMLElement
  editor: AtomCore.IEditor
  createdCallback() {
    var preview = this.innerText
    this.innerText = ""

    this.editor = atom.workspace.buildTextEditor({
      lineNumberGutterVisible: false,
      softWrapped: true,
      mini: true,
    })
    var editorElement: HTMLElement = atom.views.getView(this.editor)
    editorElement.removeAttribute("tabindex") // make read-only
    this.editor.setText(preview)
    this.editor.setGrammar(atom.grammars.grammarForScopeName("source.tsx"))
    this.editor.scrollToBufferPosition([0, 0])

    this.appendChild(editorElement)
  }

  // API
  text(text: string) {
    this.editor.setText(text)
  }
}

;(<any>document).registerElement("ts-view", TsView)

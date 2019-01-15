import * as Atom from "atom"
import {Datatip, DatatipProvider} from "atom/ide"
import {GetClientFunction} from "../../client"
import {locationToPoint, typeScriptScopes} from "../atom/utils"

// Note: a horrible hack to avoid dependency on React
const REACT_ELEMENT_SYMBOL = Symbol.for("react.element")
const etch = {
  dom(type: string, props: any, ...children: any[]): any {
    if (children.length > 0) {
      return {
        $$typeof: REACT_ELEMENT_SYMBOL,
        type,
        ref: null,
        props: {...props, children},
      }
    } else {
      return {
        $$typeof: REACT_ELEMENT_SYMBOL,
        type,
        ref: null,
        props: {...props},
      }
    }
  },
}

export class TSDatatipProvider implements DatatipProvider {
  public readonly providerName = "TypeScript type tooltips"
  public readonly priority = 100
  public readonly grammarScopes = typeScriptScopes()

  constructor(private getClient: GetClientFunction) {}

  public async datatip(
    editor: Atom.TextEditor,
    bufferPt: Atom.Point,
  ): Promise<Datatip | undefined> {
    try {
      const filePath = editor.getPath()
      if (filePath === undefined) return
      const client = await this.getClient(filePath)
      const result = await client.execute("quickinfo", {
        file: filePath,
        line: bufferPt.row + 1,
        offset: bufferPt.column + 1,
      })
      const data = result.body!
      const code = await highlightCode(data.displayString.replace(/^\(.+?\)\s+/, ""))
      const kind = (
        <div class="atom-typescript-datatip-tooltip-kind">
          {data.kind}
          {data.kindModifiers ? <i> ({data.kindModifiers})</i> : null}
        </div>
      )
      const docs = <div class="atom-typescript-datatip-tooltip-doc">{data.documentation}</div>
      return {
        component: () => (
          <div class="atom-typescript-datatip-tooltip">
            {code}
            {kind}
            {docs}
          </div>
        ),
        range: Atom.Range.fromObject([locationToPoint(data.start), locationToPoint(data.end)]),
      }
    } catch (e) {
      return
    }
  }
}

async function highlightCode(code: string) {
  const fontFamily = atom.config.get("editor.fontFamily")

  const ed = new Atom.TextEditor({
    readonly: true,
    keyboardInputEnabled: false,
    showInvisibles: false,
    tabLength: atom.config.get("editor.tabLength"),
  })
  const el = atom.views.getView(ed)
  try {
    el.setUpdatedSynchronously(true)
    el.style.pointerEvents = "none"
    el.style.position = "absolute"
    el.style.width = "0px"
    el.style.height = "1px"
    atom.views.getView(atom.workspace).appendChild(el)
    atom.grammars.assignLanguageMode(ed.getBuffer(), "source.ts")
    ed.setText(code.replace(/\r?\n$/, ""))
    await editorTokenized(ed)
    const html = Array.from(el.querySelectorAll(".line:not(.dummy)"))
    return (
      <div
        style={{fontFamily}}
        class="atom-typescript-datatip-tooltip-code"
        dangerouslySetInnerHTML={{__html: html.map(x => x.innerHTML).join("\n")}}
      />
    )
  } finally {
    el.remove()
  }
}

async function editorTokenized(editor: Atom.TextEditor) {
  return new Promise(resolve => {
    if (editor.getBuffer().getLanguageMode().fullyTokenized) {
      resolve()
    } else {
      const disp = editor.onDidTokenize(() => {
        disp.dispose()
        resolve()
      })
    }
  })
}

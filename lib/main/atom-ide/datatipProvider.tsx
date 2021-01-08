import * as Atom from "atom"
import {Datatip, DatatipProvider} from "atom-ide-base"
import {GetClientFunction} from "../../client"
import {renderTooltip} from "../atom/tooltips/tooltipRenderer"
import {highlight, locationToPoint, typeScriptScopes} from "../atom/utils"
import {scopeForFenceName} from "../atom/utils/extension-helper"

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
      const tooltip = await renderTooltip(data, etch, "react", highlightCode, highlightCodeRaw)
      return {
        component: () => <div className="atom-typescript-datatip-tooltip">{tooltip}</div>,
        range: Atom.Range.fromObject([locationToPoint(data.start), locationToPoint(data.end)]),
      }
    } catch (e) {
      return
    }
  }
}

async function highlightCode(code: string) {
  const fontFamily = atom.config.get("editor.fontFamily")

  const html = await highlightCodeRaw(code.replace(/\r?\n$/, ""), "ts")
  return (
    <div
      style={{fontFamily}}
      className="atom-typescript-datatip-tooltip-code"
      dangerouslySetInnerHTML={{__html: html}}
    />
  )
}

async function highlightCodeRaw(code: string, lang: string) {
  console.log(code, lang)
  const html = await highlight(code.replace(/\r?\n$/, ""), scopeForFenceName(lang))
  return html.join("\n")
}

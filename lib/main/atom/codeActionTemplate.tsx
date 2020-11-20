import * as etch from "etch"
import {CodeAction} from "typescript/lib/protocol"

export function codeActionTemplate(codeAction: CodeAction) {
  return <li>{codeAction.description}</li>
}

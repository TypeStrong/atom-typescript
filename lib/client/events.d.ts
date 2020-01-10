import * as p from "typescript/lib/protocol"
export type EventTypes = {[T in p.DiagnosticEventKind]: p.DiagnosticEventBody} & {
  configFileDiag: p.ConfigFileDiagnosticEventBody
}

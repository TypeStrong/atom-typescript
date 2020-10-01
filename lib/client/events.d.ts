import p from "typescript/lib/protocol"
export type DiagnosticEventTypes = {[T in p.DiagnosticEventKind]: p.DiagnosticEventBody} & {
  configFileDiag: p.ConfigFileDiagnosticEventBody
}

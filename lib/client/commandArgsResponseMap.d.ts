import * as p from "typescript/lib/protocol"

export interface CommandArgResponseMap {
  change: (x: p.ChangeRequestArgs) => void
  close: (x: p.FileRequestArgs) => void
  compileOnSaveAffectedFileList: (x: p.FileRequestArgs) => p.CompileOnSaveAffectedFileListResponse
  compileOnSaveEmitFile: (x: p.CompileOnSaveEmitFileRequestArgs) => p.Response & {body: boolean}
  completions: (x: p.CompletionsRequestArgs) => p.CompletionsResponse
  completionEntryDetails: (x: p.CompletionDetailsRequestArgs) => p.CompletionDetailsResponse
  configure: (x: p.ConfigureRequestArguments) => p.ConfigureResponse
  definition: (x: p.FileLocationRequestArgs) => p.DefinitionResponse
  format: (x: p.FormatRequestArgs) => p.FormatResponse
  getCodeFixes: (x: p.CodeFixRequestArgs) => p.GetCodeFixesResponse
  getSupportedCodeFixes: () => p.GetSupportedCodeFixesResponse
  geterr: (x: p.GeterrRequestArgs) => void
  geterrForProject: (x: p.GeterrForProjectRequestArgs) => void
  occurrences: (x: p.FileLocationRequestArgs) => p.OccurrencesResponse
  open: (x: p.OpenRequestArgs) => void
  projectInfo: (x: p.ProjectInfoRequestArgs) => p.ProjectInfoResponse
  quickinfo: (x: p.FileLocationRequestArgs) => p.QuickInfoResponse
  references: (x: p.FileLocationRequestArgs) => p.ReferencesResponse
  reload: (x: p.ReloadRequestArgs) => p.ReloadResponse
  rename: (x: p.RenameRequestArgs) => p.RenameResponse
  saveto: (x: p.SavetoRequestArgs) => void
  navtree: (x: p.FileRequestArgs) => p.NavTreeResponse
  navto: (x: p.NavtoRequestArgs) => p.NavtoResponse
  reloadProjects: () => void
  getApplicableRefactors: (
    x: p.GetApplicableRefactorsRequestArgs,
  ) => p.GetApplicableRefactorsResponse
  getEditsForRefactor: (x: p.GetEditsForRefactorRequestArgs) => p.GetEditsForRefactorResponse
  organizeImports: (x: p.OrganizeImportsRequestArgs) => p.OrganizeImportsResponse
  exit: () => void
  signatureHelp: (x: p.SignatureHelpRequestArgs) => p.SignatureHelpResponse
}

export type AllTSClientCommands = keyof CommandArgResponseMap

export type CommandsWithResponse = {
  [K in AllTSClientCommands]: CommandRes<K> extends void ? never : K
}[AllTSClientCommands]

export type ArgType<T extends (x: any) => any> = T extends (...x: infer U) => any ? U : never

export type CommandArg<T extends AllTSClientCommands> = ArgType<CommandArgResponseMap[T]>
export type CommandRes<T extends AllTSClientCommands> = ReturnType<CommandArgResponseMap[T]>

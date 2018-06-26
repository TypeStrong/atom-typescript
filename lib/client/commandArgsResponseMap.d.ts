import * as p from "typescript/lib/protocol"

// Due to a bug in typings before TypeScript 3.0
// see https://github.com/Microsoft/TypeScript/issues/24976
interface OrganizeImportsResponse extends p.Response {
  body: ReadonlyArray<FileCodeEdits>
}
interface GetEditsForFileRenameResponse extends Response {
  body: ReadonlyArray<FileCodeEdits>
}

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
  getSupportedCodeFixes: (x: undefined) => p.GetSupportedCodeFixesResponse
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
  reloadProjects: (x: undefined) => void
  getApplicableRefactors: (
    x: p.GetApplicableRefactorsRequestArgs,
  ) => p.GetApplicableRefactorsResponse
  getEditsForRefactor: (x: p.GetEditsForRefactorRequestArgs) => p.GetEditsForRefactorResponse
  ping: (x: undefined) => null
  organizeImports: (x: p.OrganizeImportsRequestArgs) => OrganizeImportsResponse
}

export type ArgType<T extends (x: any) => any> = T extends (x: infer U) => any ? U : never

export type CommandArg<T extends keyof CommandArgResponseMap> = ArgType<CommandArgResponseMap[T]>
export type CommandRes<T extends keyof CommandArgResponseMap> = ReturnType<CommandArgResponseMap[T]>

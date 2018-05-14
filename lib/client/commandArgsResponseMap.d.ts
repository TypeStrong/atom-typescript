import * as protocol from "typescript/lib/protocol"

export interface CommandArgResponseMap {
  change: {
    args: protocol.ChangeRequestArgs
    res: void
  }
  close: {
    args: protocol.FileRequestArgs
    res: void
  }
  compileOnSaveAffectedFileList: {
    args: protocol.FileRequestArgs
    res: protocol.CompileOnSaveAffectedFileListResponse
  }
  compileOnSaveEmitFile: {
    args: protocol.CompileOnSaveEmitFileRequestArgs
    res: protocol.Response & {body: boolean}
  }
  completions: {
    args: protocol.CompletionsRequestArgs
    res: protocol.CompletionsResponse
  }
  completionEntryDetails: {
    args: protocol.CompletionDetailsRequestArgs
    res: protocol.CompletionDetailsResponse
  }
  configure: {
    args: protocol.ConfigureRequestArguments
    res: protocol.ConfigureResponse
  }
  definition: {
    args: protocol.FileLocationRequestArgs
    res: protocol.DefinitionResponse
  }
  format: {
    args: protocol.FormatRequestArgs
    res: protocol.FormatResponse
  }
  getCodeFixes: {
    args: protocol.CodeFixRequestArgs
    res: protocol.GetCodeFixesResponse
  }
  getSupportedCodeFixes: {
    args: undefined
    res: protocol.GetSupportedCodeFixesResponse
  }
  geterr: {
    args: protocol.GeterrRequestArgs
    res: void
  }
  geterrForProject: {
    args: protocol.GeterrForProjectRequestArgs
    res: void
  }
  occurrences: {
    args: protocol.FileLocationRequestArgs
    res: protocol.OccurrencesResponse
  }
  open: {
    args: protocol.OpenRequestArgs
    res: void
  }
  projectInfo: {
    args: protocol.ProjectInfoRequestArgs
    res: protocol.ProjectInfoResponse
  }
  quickinfo: {
    args: protocol.FileLocationRequestArgs
    res: protocol.QuickInfoResponse
  }
  references: {
    args: protocol.FileLocationRequestArgs
    res: protocol.ReferencesResponse
  }
  reload: {
    args: protocol.ReloadRequestArgs
    res: protocol.ReloadResponse
  }
  rename: {
    args: protocol.RenameRequestArgs
    res: protocol.RenameResponse
  }
  saveto: {
    args: protocol.SavetoRequestArgs
    res: void
  }
  navtree: {
    args: protocol.FileRequestArgs
    res: protocol.NavTreeResponse
  }
  navto: {
    args: protocol.NavtoRequestArgs
    res: protocol.NavtoResponse
  }
  reloadProjects: {
    args: undefined
    res: void
  }
  getApplicableRefactors: {
    args: protocol.GetApplicableRefactorsRequestArgs
    res: protocol.GetApplicableRefactorsResponse
  }
  getEditsForRefactor: {
    args: protocol.GetEditsForRefactorRequestArgs
    res: protocol.GetEditsForRefactorResponse
  }
}

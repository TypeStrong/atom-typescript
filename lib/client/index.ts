export {ClientResolver, DiagnosticTypes, DiagnosticsPayload} from "./clientResolver"
export {resolveBinary} from "./resolveBinary"

import {TypescriptServiceClient} from "./client"
import {DiagnosticsPayload} from "./clientResolver"

export {TypescriptServiceClient as TSClient}

export type GetClientFunction = (filePath: string) => Promise<TypescriptServiceClient>
export type PushErrorFunction = (payload: DiagnosticsPayload) => void
export type GetErrorsFunction = (targetFile: string) => string[]

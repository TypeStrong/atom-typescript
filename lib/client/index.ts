export {ClientResolver, DiagnosticsPayload} from "./clientResolver"
export {resolveBinary} from "./resolveBinary"

import {TypescriptServiceClient} from "./client"
import {DiagnosticsPayload} from "./clientResolver"

export {TypescriptServiceClient as TSClient}

export type GetClientFunction = (filePath: string) => Promise<TypescriptServiceClient>
export type PushErrorFunction = (targetFile: string, payload: DiagnosticsPayload) => void
export type MakeCheckListFunction = (targetFile: string, references: string[]) => Promise<string[]>

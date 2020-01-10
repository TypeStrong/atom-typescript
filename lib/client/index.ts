export {ClientResolver} from "./clientResolver"
export {resolveBinary} from "./resolveBinary"

import {TypescriptServiceClient} from "./client"

export {TypescriptServiceClient as TSClient}

export type GetClientFunction = (filePath: string) => Promise<TypescriptServiceClient>

export {ClientResolver, resolveBinary} from "./clientResolver"

import {TypescriptServiceClient} from "./client"

export {TypescriptServiceClient as TSClient}

export type GetClientFunction = (filePath: string) => Promise<TypescriptServiceClient>

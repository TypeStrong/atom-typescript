import {TypescriptServiceClient as Client} from "./client"
import * as path from "path"
import * as Resolve from "resolve"
import {
  Diagnostic,
  DiagnosticEventBody,
  ConfigFileDiagnosticEventBody,
} from "typescript/lib/protocol"
import {Emitter} from "atom"

type DiagnosticTypes = protocol.DiagnosticEventKind | "configFileDiag"

interface DiagnosticsPayload {
  diagnostics: Diagnostic[]
  filePath: string
  serverPath: string
  type: DiagnosticTypes
}

interface Binary {
  version: string
  pathToBin: string
}

interface ClientRec {
  client: Client
  pending: string[]
}

export interface EventTypes {
  diagnostics: DiagnosticsPayload
  pendingRequestsChange: string[]
}

/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
export class ClientResolver {
  public clients = new Map<string, ClientRec>()
  private emitter = new Emitter<{}, EventTypes>()

  // This is just here so TypeScript can infer the types of the callbacks when using "on" method
  public on<T extends keyof EventTypes>(event: T, callback: (result: EventTypes[T]) => void) {
    return this.emitter.on(event, callback)
  }

  public async get(pFilePath: string): Promise<Client> {
    const {pathToBin, version} = await resolveBinary(pFilePath, "tsserver")

    const clientRec = this.clients.get(pathToBin)
    if (clientRec) return clientRec.client

    const newClientRec: ClientRec = {
      client: new Client(pathToBin, version),
      pending: [],
    }
    this.clients.set(pathToBin, newClientRec)

    newClientRec.client.on("pendingRequestsChange", pending => {
      newClientRec.pending = pending
      this.emitter.emit("pendingRequestsChange", pending)
    })

    const diagnosticHandler = (type: DiagnosticTypes) => (
      result: DiagnosticEventBody | ConfigFileDiagnosticEventBody,
    ) => {
      const filePath = isConfDiagBody(result) ? result.configFile : result.file

      if (filePath) {
        this.emitter.emit("diagnostics", {
          type,
          serverPath: pathToBin,
          filePath,
          diagnostics: result.diagnostics,
        })
      }
    }

    newClientRec.client.on("configFileDiag", diagnosticHandler("configFileDiag"))
    newClientRec.client.on("semanticDiag", diagnosticHandler("semanticDiag"))
    newClientRec.client.on("syntaxDiag", diagnosticHandler("syntaxDiag"))
    newClientRec.client.on("suggestionDiag", diagnosticHandler("suggestionDiag"))

    return newClientRec.client
  }

  public dispose() {
    this.emitter.dispose()
  }
}

// Promisify the async resolve function
const resolveModule = (id: string, opts: Resolve.AsyncOpts): Promise<string> => {
  return new Promise<string>((resolve, reject) =>
    Resolve(id, opts, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    }),
  )
}

export async function resolveBinary(sourcePath: string, binName: string): Promise<Binary> {
  const {NODE_PATH} = process.env as {NODE_PATH?: string}
  const defaultPath = require.resolve(`typescript/bin/${binName}`)

  const resolvedPath = await resolveModule(`typescript/bin/${binName}`, {
    basedir: path.dirname(sourcePath),
    paths: NODE_PATH !== undefined ? NODE_PATH.split(path.delimiter) : undefined,
  }).catch(() => defaultPath)

  const packagePath = path.resolve(resolvedPath, "../../package.json")
  // tslint:disable-next-line:no-unsafe-any
  const version: string = require(packagePath).version

  return {
    version,
    pathToBin: resolvedPath,
  }
}

function isConfDiagBody(body: any): body is ConfigFileDiagnosticEventBody {
  // tslint:disable-next-line:no-unsafe-any
  return body && body.triggerFile && body.configFile
}

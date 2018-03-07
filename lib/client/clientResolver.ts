import {TypescriptServiceClient as Client} from "./client"
import * as events from "events"
import * as path from "path"
import * as Resolve from "resolve"
import {
  Diagnostic,
  DiagnosticEventBody,
  ConfigFileDiagnosticEventBody,
} from "typescript/lib/protocol"

type DiagnosticTypes = "configFileDiag" | "semanticDiag" | "syntaxDiag"

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

/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
export class ClientResolver extends events.EventEmitter {
  public clients = new Map<string, ClientRec>()

  // This is just here so Typescript can infer the types of the callbacks when using "on" method
  public on(event: "diagnostics", callback: (result: DiagnosticsPayload) => void): this
  public on(event: "pendingRequestsChange", callback: () => void): this
  public on(event: string, callback: (() => void) | ((result: DiagnosticsPayload) => void)): this {
    return super.on(event, callback)
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

    newClientRec.client.startServer()

    newClientRec.client.on("pendingRequestsChange", pending => {
      newClientRec.pending = pending
      this.emit("pendingRequestsChange")
    })

    const diagnosticHandler = (type: string) => (
      result: DiagnosticEventBody | ConfigFileDiagnosticEventBody,
    ) => {
      const filePath = isConfDiagBody(result) ? result.configFile : result.file

      if (filePath) {
        this.emit("diagnostics", {
          type,
          pathToBin,
          filePath,
          diagnostics: result.diagnostics,
        })
      }
    }

    newClientRec.client.on("configFileDiag", diagnosticHandler("configFileDiag"))
    newClientRec.client.on("semanticDiag", diagnosticHandler("semanticDiag"))
    newClientRec.client.on("syntaxDiag", diagnosticHandler("syntaxDiag"))

    return newClientRec.client
  }

  public dispose() {
    this.removeAllListeners()
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
  const {NODE_PATH} = process.env
  const defaultPath = require.resolve(`typescript/bin/${binName}`)

  const resolvedPath = await resolveModule(`typescript/bin/${binName}`, {
    basedir: path.dirname(sourcePath),
    paths: NODE_PATH && NODE_PATH.split(path.delimiter),
  }).catch(() => defaultPath)

  const packagePath = path.resolve(resolvedPath, "../../package.json")
  const version = require(packagePath).version

  return {
    version,
    pathToBin: resolvedPath,
  }
}

function isConfDiagBody(body: any): body is ConfigFileDiagnosticEventBody {
  return body && body.triggerFile && body.configFile
}

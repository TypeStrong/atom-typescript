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

interface Server {
  version: string
  serverPath: string
}

const defaultServer: Server = {
  serverPath: require.resolve("typescript/bin/tsserver"),
  version: require("typescript").version,
}

/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
export class ClientResolver extends events.EventEmitter {
  clients: {
    [tsServerPath: string]: {
      client: Client
      pending: string[]
    }
  } = {}

  // This is just here so Typescript can infer the types of the callbacks when using "on" method
  on(event: "diagnostics", callback: (result: DiagnosticsPayload) => void): this
  on(event: "pendingRequestsChange", callback: () => void): this
  on(event: string, callback: (() => void) | ((result: DiagnosticsPayload) => void)): this {
    return super.on(event, callback)
  }

  get(filePath: string): Promise<Client> {
    return resolveServer(filePath).catch(() => defaultServer).then(({serverPath, version}) => {
      if (this.clients[serverPath]) {
        return this.clients[serverPath].client
      }

      const entry = this.addClient(serverPath, new Client(serverPath, version))

      entry.client.startServer()

      entry.client.on("pendingRequestsChange", pending => {
        entry.pending = pending
        this.emit("pendingRequestsChange")
      })

      const diagnosticHandler = (
        type: string,
        result: DiagnosticEventBody | ConfigFileDiagnosticEventBody,
      ) => {
        const filePath = isConfDiagBody(result) ? result.configFile : result.file

        if (filePath) {
          this.emit("diagnostics", {
            type,
            serverPath,
            filePath,
            diagnostics: result.diagnostics,
          })
        }
      }

      entry.client.on("configFileDiag", diagnosticHandler.bind(this, "configFileDiag"))
      entry.client.on("semanticDiag", diagnosticHandler.bind(this, "semanticDiag"))
      entry.client.on("syntaxDiag", diagnosticHandler.bind(this, "syntaxDiag"))

      return entry.client
    })
  }

  addClient(serverPath: string, client: Client) {
    this.clients[serverPath] = {
      client,
      pending: [],
    }

    return this.clients[serverPath]
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

export async function resolveServer(sourcePath: string): Promise<Server> {
  const {NODE_PATH} = process.env

  const resolvedPath = await resolveModule("typescript/bin/tsserver", {
    basedir: path.dirname(sourcePath),
    paths: NODE_PATH && [NODE_PATH],
  })

  const packagePath = path.resolve(resolvedPath, "../../package.json")
  const version = require(packagePath).version

  return {
    version,
    serverPath: resolvedPath,
  }
}

function isConfDiagBody(body: any): body is ConfigFileDiagnosticEventBody {
  return body && body.triggerFile && body.configFile
}

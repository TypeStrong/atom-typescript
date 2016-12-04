import {TypescriptServiceClient as Client} from "./client"
import * as events from "events"
import * as path from "path"
import * as nodeResolve from "resolve"
import {Diagnostic, DiagnosticEventBody, ConfigFileDiagnosticEventBody} from "typescript/lib/protocol"

type DiagnosticTypes = "configFileDiag" | "semanticDiag" | "syntaxDiag"

interface DiagnosticsPayload {
  diagnostics: Diagnostic[]
  filePath: string,
  serverPath: string,
  type: DiagnosticTypes,
}

const defaultServerPath = require.resolve("typescript/bin/tsserver")

/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
export class ClientResolver extends events.EventEmitter {

  clients: {
    [tsServerPath: string]: {
      client: Client,
      pending: string[],
    }
  } = {}

  // This is just here so Typescript can infer the types of the callbacks when using "on" method
  on(event: "diagnostics", callback: (result: DiagnosticsPayload) => any): this
  on(event: "pendingRequestsChange", callback: Function): this
  on(event: string, callback: Function): this {
    return super.on(event, callback)
  }

  get(filePath: string): Promise<Client> {
    return resolveServer(filePath)
      .catch(() => defaultServerPath)
      .then(serverPath => {
        if (this.clients[serverPath]) {
          return this.clients[serverPath].client
        }

        const entry = this.clients[serverPath] = {
          client: new Client(serverPath),
          pending: [],
        }

        entry.client.startServer()

        entry.client.on("pendingRequestsChange", pending => {
          entry.pending = pending
          this.emit("pendingRequestsChange")
        })

        const diagnosticHandler = (type: string, result: DiagnosticEventBody | ConfigFileDiagnosticEventBody) => {
          this.emit("diagnostics", {
            type,
            serverPath,
            filePath: isConfDiagBody(result) ? result.configFile : result.file,
            diagnostics: result.diagnostics
          })
        }

        entry.client.on("configFileDiag", diagnosticHandler.bind(this, "configFileDiag"))
        entry.client.on("semanticDiag", diagnosticHandler.bind(this, "semanticDiag"))
        entry.client.on("syntaxDiag", diagnosticHandler.bind(this, "syntaxDiag"))

        return entry.client
      })
  }
}

export function resolveServer(sourcePath: string): Promise<string> {
  const basedir = path.dirname(sourcePath)

  return new Promise((resolve, reject) => {
    nodeResolve("typescript/bin/tsserver", {basedir}, (err, resolvedPath) => {
      if (err) {
        reject(err)
      } else {
        resolve(resolvedPath)
      }
    })
  })
}

function isConfDiagBody(body: any): body is ConfigFileDiagnosticEventBody {
  return body && body.triggerFile && body.configFile
}

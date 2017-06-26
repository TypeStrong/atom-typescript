import {TypescriptServiceClient as Client} from "./client"
import * as events from "events"
import * as path from "path"
import {sync as resolveSync} from "resolve"
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
      retained: number
    }
  } = {}

  // This is just here so Typescript can infer the types of the callbacks when using "on" method
  on(event: "diagnostics", callback: (result: DiagnosticsPayload) => void): this
  on(event: "pendingRequestsChange", callback: () => void): this
  on(event: string, callback: () => void): this {
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
      retained: 0,
    }

    return this.clients[serverPath]
  }

  async retain(filePath: string) {
    const client = await this.get(filePath)
    const clientInfo = this.clients[client.tsServerPath]

    if (!clientInfo) {
      throw new Error("Could not find server for: " + filePath)
    }

    clientInfo.retained += 1
  }

  release(filePath: string) {
    // Sleep a little and then decrement the retained counter. If it's 0,
    // shut the server down.
    setTimeout(async () => {
      const client = await this.get(filePath)
      const clientInfo = this.clients[client.tsServerPath]

      if (!clientInfo) {
        return
      }

      clientInfo.retained -= 1

      if (clientInfo.retained <= 0) {
        delete this.clients[client.tsServerPath]
        client.stopServer()
        client.dispose()
      }
    }, 300)
  }
}

export async function resolveServer(sourcePath: string): Promise<Server> {
  const resolvedPath = resolveSync("typescript/bin/tsserver", {
    basedir: path.dirname(sourcePath),
    paths: process.env.NODE_PATH && [process.env.NODE_PATH],
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

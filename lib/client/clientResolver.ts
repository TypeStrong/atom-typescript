import {CompositeDisposable, Emitter} from "atom"
import ts from "typescript"
import {
  ConfigFileDiagnosticEventBody,
  Diagnostic,
  DiagnosticEventBody,
} from "typescript/lib/protocol"
import {ReportBusyWhile} from "../main/pluginManager"
import {handlePromise} from "../utils"
import {TypescriptServiceClient as Client} from "./client"
import {resolveBinary} from "./resolveBinary"

export type DiagnosticTypes = protocol.DiagnosticEventKind | "configFileDiag"

interface DiagnosticsPayload {
  diagnostics: Diagnostic[]
  filePath: string
  serverPath: string
  type: DiagnosticTypes
}

export interface EventTypes {
  diagnostics: DiagnosticsPayload
}

/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
export class ClientResolver {
  private clients = new Map<string, Map<string | undefined, Client>>()
  private memoizedClients = new Map<string, Promise<Client>>()
  private emitter = new Emitter<{}, EventTypes>()
  private subscriptions = new CompositeDisposable()
  private tsserverInstancePerTsconfig =
    atom.config.get("atom-typescript").tsserverInstancePerTsconfig
  // This is just here so TypeScript can infer the types of the callbacks when using "on" method
  // tslint:disable-next-line:member-ordering
  public on = this.emitter.on.bind(this.emitter)

  constructor(private reportBusyWhile: ReportBusyWhile) {}

  public async restartAllServers() {
    await this.reportBusyWhile("Restarting servers", () =>
      Promise.all(Array.from(this.getAllClients()).map((client) => client.restartServer())),
    )
  }

  public async get(pFilePath: string): Promise<Client> {
    const memo = this.memoizedClients.get(pFilePath)
    if (memo) return memo
    const client = this._get(pFilePath)
    this.memoizedClients.set(pFilePath, client)
    try {
      return await client
    } catch (e) {
      this.memoizedClients.delete(pFilePath)
      throw e
    }
  }

  public dispose() {
    this.emitter.dispose()
    this.subscriptions.dispose()
    this.memoizedClients.clear()
    for (const tsconfigMap of this.clients.values()) {
      for (const client of tsconfigMap.values()) {
        handlePromise(client.destroy())
      }
    }
    this.clients.clear()
  }

  private async _get(pFilePath: string): Promise<Client> {
    const {pathToBin, version} = await resolveBinary(pFilePath, "tsserver")
    const tsconfigPath = this.tsserverInstancePerTsconfig
      ? ts.findConfigFile(pFilePath, (f) => ts.sys.fileExists(f))
      : undefined

    let tsconfigMap = this.clients.get(pathToBin)
    if (!tsconfigMap) {
      tsconfigMap = new Map()
      this.clients.set(pathToBin, tsconfigMap)
    }
    const client = tsconfigMap.get(tsconfigPath)
    if (client) return client

    const newClient = new Client(pathToBin, version, this.reportBusyWhile)
    tsconfigMap.set(tsconfigPath, newClient)

    this.subscriptions.add(
      newClient.on("configFileDiag", this.diagnosticHandler(pathToBin, "configFileDiag")),
      newClient.on("semanticDiag", this.diagnosticHandler(pathToBin, "semanticDiag")),
      newClient.on("syntaxDiag", this.diagnosticHandler(pathToBin, "syntaxDiag")),
      newClient.on("suggestionDiag", this.diagnosticHandler(pathToBin, "suggestionDiag")),
    )

    return newClient
  }

  private *getAllClients() {
    for (const tsconfigMap of this.clients.values()) {
      yield* tsconfigMap.values()
    }
  }

  private diagnosticHandler =
    (serverPath: string, type: DiagnosticTypes) =>
    (result: DiagnosticEventBody | ConfigFileDiagnosticEventBody) => {
      const filePath = isConfDiagBody(result) ? result.configFile : result.file

      if (filePath) {
        this.emitter.emit("diagnostics", {
          type,
          serverPath,
          filePath,
          diagnostics: result.diagnostics,
        })
      }
    }
}

function isConfDiagBody(body: any): body is ConfigFileDiagnosticEventBody {
  // tslint:disable-next-line:no-unsafe-any
  return body && body.triggerFile && body.configFile
}

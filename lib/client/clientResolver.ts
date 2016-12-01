import {TypescriptServiceClient as Client} from "./client"
import * as events from "events"
import * as path from "path"
import * as nodeResolve from "resolve"

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

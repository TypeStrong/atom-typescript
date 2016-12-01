import {ClientResolver} from "../client/clientResolver"
import * as mainPanel from "../main/atom/views/mainPanelView"
import * as tsconfig from "tsconfig/dist/tsconfig"

export const clients = new ClientResolver()

clients.on("pendingRequestsChange", () => {
  // We only start once the panel view is initialized
  if (!mainPanel.panelView) return;

  const pending = Object.keys(clients.clients)
    .map(serverPath => clients.clients[serverPath].pending)

  mainPanel.panelView.updatePendingRequests([].concat.apply([], pending))
})

export function loadProjectConfig(sourcePath: string): Promise<tsconfig.TSConfig> {
  return clients.get(sourcePath).then(client => {
    return client.executeProjectInfo({needFileNameList: false, file: sourcePath}).then(result => {
      return tsconfig.load(result.body.configFileName)
    })
  })
}

import {WithTypescriptBuffer} from "../../../pluginManager"
import {EditorPositionHistoryManager} from "../../EditorPositionHistoryManager"
export interface Deps {
  withTypescriptBuffer: WithTypescriptBuffer
  getEditorPositionHistoryManager: () => EditorPositionHistoryManager
}

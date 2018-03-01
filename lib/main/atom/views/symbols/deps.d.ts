import {WithTypescriptBuffer} from "../../../plugin-manager"
import {EditorPositionHistoryManager} from "../../EditorPositionHistoryManager"
export interface Deps {
  withTypescriptBuffer: WithTypescriptBuffer
  getEditorPositionHistoryManager: () => EditorPositionHistoryManager
}

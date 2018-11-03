import {GetClientFunction} from "../../../../client"
import {EditorPositionHistoryManager} from "../../editorPositionHistoryManager"
export interface Deps {
  getClient: GetClientFunction
  histGoForward: EditorPositionHistoryManager["goForward"]
}

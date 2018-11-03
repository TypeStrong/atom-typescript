import {GetClientFunction} from "../../../../client"
import {NavigationTreeComponent} from "./navigationTreeComponent"
import {NavigationTreeViewModel} from "./semanticViewModel"

export const SEMANTIC_VIEW_URI = "atom-typescript://semantic-view"

export interface SemanticViewOptions {
  navTree: NavigationTreeViewModel | null
}

export interface SemanticViewSerializationData {
  data: SemanticViewOptions
  deserializer: "atomts-semantic-view/SemanticView"
}

export class SemanticView {
  public static create(config: SemanticViewOptions) {
    if (!SemanticView.instance) SemanticView.instance = new SemanticView(config)
    return SemanticView.instance
  }
  private static instance: SemanticView | null = null
  private comp: NavigationTreeComponent

  public get element() {
    return this.comp.element
  }

  private constructor(config: SemanticViewOptions) {
    this.comp = new NavigationTreeComponent({navTree: config.navTree})
  }

  public async setGetClient(gc: GetClientFunction) {
    await this.comp.setGetClient(gc)
    await this.comp.update({})
  }

  public getTitle() {
    return "TypeScript"
  }

  public getURI() {
    return SEMANTIC_VIEW_URI
  }

  public async destroy() {
    SemanticView.instance = null
    await this.comp.destroy()
  }

  public getDefaultLocation() {
    return "right"
  }

  public getAllowedLocations() {
    // The locations into which the item can be moved.
    return ["left", "right"]
  }

  public serialize(): SemanticViewSerializationData {
    return {
      deserializer: "atomts-semantic-view/SemanticView",
      data: {navTree: this.comp.props.navTree},
    }
  }
}

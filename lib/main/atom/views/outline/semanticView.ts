import {NavigationTreeComponent} from "./navigationTreeComponent"
import {NavigationTreeViewModel} from "./semanticViewModel"
import {ClientResolver} from "../../../../client/clientResolver"

const SEMANTIC_VIEW_URI = "atom-typescript://semantic-view"

export interface SemanticViewOptions {
  navTree: NavigationTreeViewModel | null
}

export interface SemanticViewSerializationData {
  data: SemanticViewOptions
  deserializer: "atomts-semantic-view/SemanticView"
}

export function deserializeSemanticView(serialized: SemanticViewSerializationData) {
  return SemanticView.create(serialized.data)
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

  private constructor(public config: SemanticViewOptions) {
    this.comp = new NavigationTreeComponent({navTree: config.navTree})
  }

  public setClientResolver(cr: ClientResolver) {
    this.comp.setClientResolver(cr)
  }

  public getTitle() {
    return "TypeScript"
  }

  public getURI() {
    return SEMANTIC_VIEW_URI
  }

  public destroy() {
    SemanticView.instance = null
    this.comp.destroy()
  }

  public getDefaultLocation() {
    return "right"
  }

  public getAllowedLocations() {
    // The locations into which the item can be moved.
    return ["left", "right"]
  }

  public serialize(): SemanticViewSerializationData {
    // console.log("SemanticView.serialize()") // DEBUG
    return {
      deserializer: "atomts-semantic-view/SemanticView",
      data: {navTree: this.comp.props.navTree},
    }
  }
}

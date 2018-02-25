import {NavigationTreeComponent} from "./navigationTreeComponent"
import {NavigationTreeViewModel} from "./semanticViewModel"

export const SEMANTIC_VIEW_URI = "atomts-semantic-view"

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
  private static instance: SemanticView | null = null
  public static create(config: SemanticViewOptions) {
    if (!SemanticView.instance) SemanticView.instance = new SemanticView(config)
    return SemanticView.instance
  }
  private comp: NavigationTreeComponent

  public static readonly URI = "atom://" + SEMANTIC_VIEW_URI

  public get element() {
    return this.comp.element
  }

  private constructor(public config: SemanticViewOptions) {
    this.comp = new NavigationTreeComponent({navTree: config.navTree})
  }

  getTitle() {
    return "TypeScript"
  }

  getURI() {
    return SemanticView.URI
  }

  destroy() {
    SemanticView.instance = null
    this.comp.destroy()
  }

  getDefaultLocation() {
    return "right"
  }

  getAllowedLocations() {
    // The locations into which the item can be moved.
    return ["left", "right"]
  }

  serialize(): SemanticViewSerializationData {
    // console.log("SemanticView.serialize()") // DEBUG
    return {
      deserializer: "atomts-semantic-view/SemanticView",
      data: {navTree: this.comp.props.navTree},
    }
  }
}

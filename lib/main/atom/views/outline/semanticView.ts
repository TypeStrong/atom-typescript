import {NavigationTreeComponent} from "./navigationTreeComponent"
import {NavigationTreeViewModel} from "./semanticViewModel"

export const SEMANTIC_VIEW_URI = "atomts-semantic-view"

export interface SemanticViewOptions {
  navTree?: NavigationTreeViewModel | null
}

export interface SemanticViewSerializationData {
  data: {navTree: NavigationTreeViewModel | null}
  deserializer: "atomts-semantic-view/SemanticView"
}

export function deserializeSemanticView(serialized: SemanticViewSerializationData) {
  return new SemanticView(serialized.data)
}

export class SemanticView {
  private comp: NavigationTreeComponent

  public get element() {
    return this.comp.element
  }

  constructor(public config: SemanticViewOptions) {
    this.comp = new NavigationTreeComponent({navTree: (config && config.navTree) || null})
  }

  getTitle() {
    return "TypeScript"
  }

  getURI() {
    return "atom://" + SEMANTIC_VIEW_URI
  }
  // Tear down any state and detach
  destroy() {
    if (this.comp) {
      this.comp.destroy()
    }
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

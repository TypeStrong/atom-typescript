import {NavigationTreeComponent} from "./navigationTreeComponent"
import {NavigationTreeViewModel} from "./semanticViewModel"
import {initialize} from "./semanticViewController"

export const SEMANTIC_VIEW_URI = "atomts-semantic-view"

export interface SemanticViewOptions {
  navTree: NavigationTreeViewModel | null
}

export interface SemanticViewSerializationData {
  data: SemanticViewOptions
  deserializer: "atomts-semantic-view/SemanticView"
}

export function deserializeSemanticView(serialized: SemanticViewSerializationData) {
  // console.log('deserializeSemanticView -> ', serialized)// DEBUG
  const view = new SemanticView(serialized.data)
  initialize(view)
  return view
}

export class SemanticView {
  private comp: NavigationTreeComponent

  public static readonly URI = "atom://" + SEMANTIC_VIEW_URI

  public get element() {
    return this.comp.element
  }

  constructor(public config: SemanticViewOptions) {
    this.comp = new NavigationTreeComponent({navTree: config.navTree || null})
  }

  getTitle() {
    return "TypeScript"
  }

  getURI() {
    return SemanticView.URI
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

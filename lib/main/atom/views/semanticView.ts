import {SemanticViewComponent} from "./semanticViewComponent"

export const SEMANTIC_VIEW_URI = "atomts-semantic-view"

export interface SemanticViewOptions {}

export class SemanticView {
  private comp: SemanticViewComponent

  public get element() {
    return this.comp.element
  }

  constructor(public config: SemanticViewOptions) {
    this.comp = new SemanticViewComponent({navTree: null})
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

  // TODO activate serialization/deserialization
  // add to package.json:
  // "deserializers": {
  //   "atomts-semantic-view/SemanticView": "deserializeSemanticView"
  // },
  //
  // serialize() {
  //   return {
  //     // This is used to look up the deserializer function. It can be any string, but it needs to be
  //     // unique across all packages!
  //     deserializer: "atomts-semantic-view/SemanticView",
  //     data: {},
  //   }
  // }
  //
  // static deserializeSemanticView(serialized: any) {
  //   // TODO should store & restore the expansion-state of the nodes
  //   return new SemanticView(serialized)
  // }
}

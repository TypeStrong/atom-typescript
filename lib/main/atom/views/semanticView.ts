import {SemanticViewComponent, NavigationTreeExt} from "./semanticViewComponent"

export const SEMANTIC_VIEW_URI = "atomts-semantic-view"

export interface SemanticViewOptions {}

export class SemanticView {
  public get rootDomElement() {
    return this.element
  }
  public element: HTMLElement
  private comp: SemanticViewComponent | null

  constructor(public config: SemanticViewOptions) {
    // super(config)
    this.element = document.createElement("div")
    this.element.classList.add("atomts", "atomts-semantic-view", "native-key-bindings")
  }

  /**
   * This function exists because the react component needs access to `panel` which needs access to `SemanticView`.
   * So we lazily create react component after panel creation
   */
  started = false
  start() {
    if (this.started && this.comp) {
      this.comp.forceUpdate()
      return
    }
    this.started = true
    this.comp = new SemanticViewComponent({navTree: {} as NavigationTreeExt})
    this.comp.componentDidMount() // TODO is there a hook in etch that gets triggered after initializion finished?
    this.rootDomElement.appendChild(this.comp.refs.main)
  }

  getElement() {
    return this.rootDomElement
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
      this.comp = null
    }
    this.element.remove()
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

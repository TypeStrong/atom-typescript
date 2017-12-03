// tslint:disable:max-classes-per-file
import sp = require("atom-space-pen-views")

export class View<Options> extends sp.View {
  get $(): JQuery {
    return this as any
  }

  static content() {
    throw new Error("Must override the base View static content member")
  }

  constructor(public options: Options) {
    super()
    this.init()
  }
  init() {
    /* noop */
  }
}

export const $ = sp.$

export class ScrollView<Options> extends sp.ScrollView {
  static content() {
    throw new Error("Must override the base View static content member")
  }

  constructor(public options: Options) {
    super()
    this.init()
  }
  init() {
    /* noop */
  }
}

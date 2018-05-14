interface HTMLAttributes {
  // Standard HTML Attributes
  accept?: string
  acceptCharset?: string
  accessKey?: string
  action?: string
  allowFullScreen?: boolean
  allowTransparency?: boolean
  alt?: string
  async?: boolean
  autoComplete?: string
  autoFocus?: boolean
  autoPlay?: boolean
  capture?: boolean
  cellPadding?: number | string
  cellSpacing?: number | string
  charSet?: string
  challenge?: string
  checked?: boolean
  classID?: string
  class?: string
  cols?: number
  colSpan?: number
  content?: string
  contentEditable?: boolean
  contextMenu?: string
  controls?: boolean
  coords?: string
  crossOrigin?: string
  data?: string
  dateTime?: string
  default?: boolean
  defer?: boolean
  dir?: string
  disabled?: boolean
  download?: any
  draggable?: boolean
  encType?: string
  form?: string
  formAction?: string
  formEncType?: string
  formMethod?: string
  formNoValidate?: boolean
  formTarget?: string
  frameBorder?: number | string
  headers?: string
  height?: number | string
  hidden?: boolean
  high?: number
  href?: string
  hrefLang?: string
  htmlFor?: string
  httpEquiv?: string
  icon?: string
  id?: string
  inputMode?: string
  integrity?: string
  is?: string
  keyParams?: string
  keyType?: string
  kind?: string
  label?: string
  lang?: string
  list?: string
  loop?: boolean
  low?: number
  manifest?: string
  marginHeight?: number
  marginWidth?: number
  max?: number | string
  maxLength?: number
  media?: string
  mediaGroup?: string
  method?: string
  min?: number | string
  minLength?: number
  multiple?: boolean
  muted?: boolean
  name?: string
  nonce?: string
  noValidate?: boolean
  open?: boolean
  optimum?: number
  pattern?: string
  placeholder?: string
  poster?: string
  preload?: string
  radioGroup?: string
  readOnly?: boolean
  rel?: string
  required?: boolean
  reversed?: boolean
  role?: string
  rows?: number
  rowSpan?: number
  sandbox?: string
  scope?: string
  scoped?: boolean
  scrolling?: string
  seamless?: boolean
  selected?: boolean
  shape?: string
  size?: number
  sizes?: string
  span?: number
  spellCheck?: boolean
  src?: string
  srcDoc?: string
  srcLang?: string
  srcSet?: string
  start?: number
  step?: number | string
  style?: {[propName: string]: string | undefined}
  summary?: string
  tabIndex?: string
  target?: string
  title?: string
  type?: string
  useMap?: string
  value?: string | string[] | number
  width?: number | string
  wmode?: string
  wrap?: string

  // RDFa Attributes
  about?: string
  datatype?: string
  inlist?: any
  prefix?: string
  property?: string
  resource?: string
  typeof?: string
  vocab?: string

  // Non-standard Attributes
  autoCapitalize?: string
  autoCorrect?: string
  autoSave?: string
  color?: string
  itemProp?: string
  itemScope?: boolean
  itemType?: string
  itemID?: string
  itemRef?: string
  results?: number
  security?: string
  unselectable?: boolean
}

interface EtchAttributes extends HTMLAttributes {
  ref?: string
  className?: string
  on?: {
    click?: (e: MouseEvent) => any
    [name: string]: ((e: any) => any) | undefined
  }
  dataset?: {
    [propName: string]: string | number
  }
  innerHTML?: string
  innerText?: string
  key?: any
}

// tslint:disable-next-line:no-namespace
declare namespace JSX {
  interface IntrinsicElements {
    // SVG
    circle: any
    clipPath: any
    defs: any
    ellipse: any
    g: any
    image: any
    line: any
    linearGradient: any
    mask: any
    path: any
    pattern: any
    polygon: any
    polyline: any
    radialGradient: any
    rect: any
    stop: any
    svg: any
    text: any
    tspan: any

    // Custom & HTML
    [elem: string]: EtchAttributes
  }
}

type SingleOrArray<T> = T | T[]
type ChildSpec = SingleOrArray<string | number | JSX.Element | null>
type TagSpec = string | ElementClassConstructor<JSX.ElementClass>
type ElementClassConstructor<T extends JSX.ElementClass> = new (
  props: T["props"],
  children: JSX.Element[],
) => T

// tslint:disable-next-line:no-namespace
declare namespace JSX {
  type Element =
    | {tag: TagSpec; props?: EtchAttributes | Props; children: Element[]}
    | {text: string | number}
  interface Props {
    ref?: string
  }
  class ElementClass {
    public props: Props
    constructor(props: Props, children?: Element[])
    public render?(): Element
    public update(props: Props, children?: Element[]): Promise<void>
  }
  interface ElementAttributesProperty {
    props: Props // specify the property name to use
  }
}

declare module "etch" {
  export function destroy(component: any, removeNode?: boolean): Promise<void>
  export function destroySync(component: any, removeNode: any): void
  export function dom(tag: string, props?: EtchAttributes, ...children: ChildSpec[]): JSX.Element
  export function dom<T extends JSX.ElementClass>(
    tag: ElementClassConstructor<T>,
    props: T["props"],
    ...children: ChildSpec[]
  ): JSX.Element
  export function getScheduler(): any
  export function initialize(component: any): void
  export function render(virtualNode: JSX.Element, options?: any): Node
  export function setScheduler(customScheduler: any): void
  export function update(component: any, replaceNode?: boolean): Promise<void>
  export function updateSync(component: any, replaceNode?: boolean): void
  // tslint:disable-next-line:class-name
  export interface dom {
    // HTML
    a(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    abbr(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    address(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    article(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    aside(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    audio(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    b(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    bdi(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    bdo(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    blockquote(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    body(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    button(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    canvas(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    caption(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    cite(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    code(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    colgroup(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    datalist(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    dd(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    del(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    details(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    dfn(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    dialog(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    div(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    dl(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    dt(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    em(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    fieldset(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    figcaption(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    figure(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    footer(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    form(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    h1(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    h2(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    h3(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    h4(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    h5(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    h6(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    head(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    header(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    html(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    i(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    iframe(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    ins(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    kbd(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    label(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    legend(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    li(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    main(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    map(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    mark(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    menu(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    meter(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    nav(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    noscript(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    object(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    ol(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    optgroup(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    option(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    output(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    p(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    pre(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    progress(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    q(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    rp(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    rt(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    ruby(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    s(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    samp(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    script(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    section(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    select(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    small(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    span(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    strong(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    style(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    sub(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    summary(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    sup(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    table(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    tbody(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    td(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    textarea(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    tfoot(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    th(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    thead(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    time(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    title(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    tr(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    u(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    ul(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    var(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    video(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    area(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    base(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    br(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    col(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    command(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    embed(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    hr(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    img(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    input(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    keygen(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    link(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    meta(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    param(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    source(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    track(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element
    wbr(props: EtchAttributes, ...children: ChildSpec[]): JSX.Element

    // SVG
    circle(props: any, ...children: ChildSpec[]): JSX.Element
    clipPath(props: any, ...children: ChildSpec[]): JSX.Element
    defs(props: any, ...children: ChildSpec[]): JSX.Element
    ellipse(props: any, ...children: ChildSpec[]): JSX.Element
    g(props: any, ...children: ChildSpec[]): JSX.Element
    image(props: any, ...children: ChildSpec[]): JSX.Element
    line(props: any, ...children: ChildSpec[]): JSX.Element
    linearGradient(props: any, ...children: ChildSpec[]): JSX.Element
    mask(props: any, ...children: ChildSpec[]): JSX.Element
    path(props: any, ...children: ChildSpec[]): JSX.Element
    pattern(props: any, ...children: ChildSpec[]): JSX.Element
    polygon(props: any, ...children: ChildSpec[]): JSX.Element
    polyline(props: any, ...children: ChildSpec[]): JSX.Element
    radialGradient(props: any, ...children: ChildSpec[]): JSX.Element
    rect(props: any, ...children: ChildSpec[]): JSX.Element
    stop(props: any, ...children: ChildSpec[]): JSX.Element
    svg(props: any, ...children: ChildSpec[]): JSX.Element
    text(props: any, ...children: ChildSpec[]): JSX.Element
    tspan(props: any, ...children: ChildSpec[]): JSX.Element
  }
}

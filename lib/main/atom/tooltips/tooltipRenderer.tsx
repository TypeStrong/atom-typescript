let renderMarkdown: ((s: string) => Promise<string>) | undefined

export async function renderTooltip(
  data: protocol.QuickInfoResponseBody | undefined,
  etch: any,
  componentType: "etch" | "react",
  tsCodeRenderer: (code: string) => Promise<JSX.Element> | JSX.Element,
  codeRendererRaw?: (code: string, lang: string) => Promise<string> | string,
) {
  if (data === undefined) return null

  const kind = (
    <div className="atom-typescript-datatip-tooltip-kind">
      {data.kind}
      {formatKindModifiers(data.kindModifiers)}
    </div>
  )

  // tslint:disable-next-line: strict-boolean-expressions // TODO: complain on TS
  const tags = data.tags
    ? data.tags.map((tag) => {
        const tagClass =
          "atom-typescript-datatip-tooltip-doc-tag " +
          `atom-typescript-datatip-tooltip-doc-tag-name-${tag.name}`
        return (
          <div className={tagClass}>
            <span className="atom-typescript-datatip-tooltip-doc-tag-name">{tag.name}</span>
            {formatTagText(etch, tag.text)}
          </div>
        )
      })
    : null

  let docstring
  if (atom.config.get("atom-typescript.markdownDatatips")) {
    if (!renderMarkdown) {
      const commonmark = await import("commonmark")
      const reader = new commonmark.Parser({smart: true})
      const writer = new commonmark.HtmlRenderer({safe: true, smart: true, softbreak: "<br/>"})
      const domParser = new DOMParser()
      renderMarkdown = async (s: string) => {
        const parsed = reader.parse(s)
        const rendered = writer.render(parsed)
        if (codeRendererRaw) {
          const dom = domParser.parseFromString(rendered, "text/html")
          console.log(dom)
          for (const el of Array.from(
            dom.querySelectorAll<HTMLPreElement>('code[class^="language-"]'),
          )) {
            el.innerHTML = await codeRendererRaw(el.innerText, el.classList[0].slice(9))
          }
          return dom.documentElement.innerHTML
        } else {
          return rendered
        }
      }
    }
    const html = await renderMarkdown(data.documentation)
    docstring =
      componentType === "react" ? (
        /* this is react-style component */
        <div
          className="atom-typescript-datatip-tooltip-doc-markdown"
          dangerouslySetInnerHTML={{__html: html}}
        />
      ) : (
        /* this is etch-style component */
        <div className="atom-typescript-datatip-tooltip-doc-markdown" innerHTML={html} />
      )
  } else {
    docstring = <div className="atom-typescript-datatip-tooltip-doc-text">{data.documentation}</div>
  }

  const docs = (
    <div className="atom-typescript-datatip-tooltip-doc">
      {docstring}
      {tags}
    </div>
  )

  const codeText = data.displayString.replace(/^\(.+?\)\s+/, "")
  return [await tsCodeRenderer(codeText), kind, docs]
}

function formatKindModifiers(etch: any, text?: string) {
  if (text === undefined) return null
  return <span className="atom-typescript-datatip-tooltip-kind-modifiers">{text}</span>
}

function formatTagText(etch: any, tagText?: string) {
  if (tagText === undefined) return null

  const [, firstWord, restOfText] = /^\s*(\S*)([^]*)$/.exec(tagText)!
  return (
    <span className="atom-typescript-datatip-tooltip-doc-tag-text">
      <span className="atom-typescript-datatip-tooltip-doc-tag-text-first-word">{firstWord}</span>
      {restOfText}
    </span>
  )
}

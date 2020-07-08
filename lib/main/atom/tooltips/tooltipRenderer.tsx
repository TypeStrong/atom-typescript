export async function renderTooltip(
  data: protocol.QuickInfoResponseBody | undefined,
  etch: any,
  codeRenderer: (code: string) => Promise<JSX.Element> | JSX.Element,
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

  const docs = (
    <div className="atom-typescript-datatip-tooltip-doc">
      {data.documentation}
      {tags}
    </div>
  )

  const codeText = data.displayString.replace(/^\(.+?\)\s+/, "")
  return [await codeRenderer(codeText), kind, docs]
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

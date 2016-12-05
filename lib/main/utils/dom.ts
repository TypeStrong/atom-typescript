interface Props {
  [key: string]: any
}

// A createElement function that matches the signature of React.createElements, but synchronously
// creates DOM elements. Useful to quickly create DOM nodes when used with JSX and reactNamespace
// compiler option.
export function createElement(name: string, props: Props, ...children) {
  if (typeof name !== "string") {
    throw new Error("String tag name expected")
  }

  const element = document.createElement(name)

  if (props) {
    for (let attr in props) {
      // Handle special cases like ref and key
      if (attr === "ref") {
        if (typeof props[attr] !== "function") {
          throw new Error("Ref attribute value should be a function")
        }
        var ref = props[attr]
        continue
      } else if (attr === "key") {
        continue
      }

      const value = props[attr]

      if (attr.startsWith("on") && attr[2] && attr[2] === attr[2].toUpperCase()) {
        // This is PROBABLY an event handle so we just lowercase the attr name
        attr = attr.toLowerCase()
      } else if (attr === "style") {
        if (typeof value === "object" && value) {
          const style = element.style
          for (const prop in value) {
            if (typeof value[prop] === "number") {
              style[prop] = value[prop] + "px"
            } else {
              style[prop] = value[prop]
            }
          }
        }

        break
      }

      element[attr] = value
    }
  }

  for (const child of children) {
    if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(child.toString()))
    } else if (child instanceof HTMLElement) {
      element.appendChild(child)
    } else if (child === null || child === undefined) {
      // do nothing
    } else {
      throw new Error("Unknown child type: " + child)
    }
  }

  if (ref) {
    ref(element)
  }
  return element
}

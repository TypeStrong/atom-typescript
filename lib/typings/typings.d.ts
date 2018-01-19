interface Window {
  atom_typescript_debug: boolean
}

// escape-html
declare module "escape-html" {
  function escape(html: string): string
  export = escape
}

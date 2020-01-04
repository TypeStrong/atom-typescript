declare module "atom-package-deps" {
  interface Module {
    install: (packageName: string, showPrompt: boolean) => Promise<void>
  }
  export = Module
}

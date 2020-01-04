declare module "atom-package-deps" {
  function install(packageName: string, showPrompt: boolean): Promise<void>
}

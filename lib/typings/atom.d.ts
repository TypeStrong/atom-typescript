export {}

declare module "atom" {
  export class CompositeDisposable {
    add(disposable: AtomCore.Disposable)
    dispose()
  }
}

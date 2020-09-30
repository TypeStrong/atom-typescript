export function handlePromise(promise: Promise<any> | undefined): void {
  if (promise === undefined) return
  // tslint:disable-next-line:strict-type-predicates no-unbound-method
  if (typeof promise.catch !== "function") {
    atom.notifications.addFatalError(
      "Atom-Typescript: non-promise passed to handlePromise. Please report this.",
      {
        stack: new Error().stack,
        dismissable: true,
      },
    )
    return
  }
  promise.catch((err: Error) => {
    atom.notifications.addFatalError(`Atom-Typescript error: ${err.message}`, {
      detail: err.toString(),
      stack: err.stack,
      dismissable: true,
    })
  })
}

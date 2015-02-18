/**
 * Type declarations for Webpack runtime.
 */

interface WebpackRequireEnsureCallback {
  ((id: string) => any) => any
}

interface WebpackRequire {
  (id: string) => any;
  ensure(ids: string[], WebpackRequireEnsureCallback) => any;
}

declare var require: WebpackRequire;

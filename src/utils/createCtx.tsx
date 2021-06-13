/**
 * Shamelessly stolen from this gist:
 *
 * https://gist.github.com/sw-yx/f18fe6dd4c43fddb3a4971e80114a052#file-createctx-nonullcheck-tsx
 */

import { useContext, createContext } from "react";

export function createCtx<A>() {
  const ctx = createContext<A | undefined>(undefined);
  function useCtx() {
    const c = useContext(ctx);
    if (!c) throw new Error("useCtx must be inside a Provider with a value");
    return c;
  }
  return [useCtx, ctx.Provider] as const;
}

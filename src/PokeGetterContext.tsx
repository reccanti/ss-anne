/**
 * A context that provides a wrapper aound the PokeGetter
 * so that we don't have to reinitialize it everywhere
 */

import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { PokeGetter, Language } from "./utils/pokeGetter";

const initialGetter = new PokeGetter({ lang: "en" });

export const PokeGetterContext = createContext<PokeGetter>(initialGetter);

export const usePokeGetter = () => useContext(PokeGetterContext);

interface Props {
  children: ReactNode;
  lang: Language;
}

export function PokeGetterProvider(props: Props) {
  const [getter, setGetter] = useState(new PokeGetter({ lang: props.lang }));

  useEffect(() => {
    setGetter(new PokeGetter({ lang: props.lang }));
  }, [props.lang]);

  return (
    <PokeGetterContext.Provider value={getter}>
      {props.children}
    </PokeGetterContext.Provider>
  );
}

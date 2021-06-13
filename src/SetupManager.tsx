import { useState, ReactNode, useEffect } from "react";
import PokeAPI, { IPokedex } from "pokeapi-typescript";
import { createCtx } from "./utils/createCtx";

type SetupState = "loading" | "ready";

interface SetupContext {
  setupState: SetupState;
}

const [useCtx, Provider] = createCtx<SetupContext>();

export const useSetupContext = useCtx;

interface Props {
  children: ReactNode;
}

export function SetupProvider({ children }: Props) {
  const [setupState, setSetupState] = useState<SetupState>("loading");

  useEffect(() => {
    const fetchAllData = async () => {
      const genPromise = PokeAPI.Generaition.resolve("generation-i");
      const dexPromise = PokeAPI.Pokedex.resolve("national");
      const [generation, pokedex] = await Promise.all([genPromise, dexPromise]);
      console.log(generation);
      console.log(pokedex);
      setSetupState("ready");
    };
    fetchAllData();
  }, []);

  const value = {
    setupState,
  };

  return <Provider value={value}>{children}</Provider>;
}

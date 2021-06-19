import { useState, ReactNode, useEffect } from "react";
import PokeAPI, { IPokedex, IGeneration, IPokemon } from "pokeapi-typescript";
import { createCtx } from "./utils/createCtx";
import { fetchPokemonByGeneration } from "./utils/pokeFuncs";

type SetupState = "loading" | "ready";

interface State {
  pokedex: IPokedex;
  generation: IGeneration;
  pokemon: IPokemon[];
}

interface SetupContext {
  setupState: SetupState;
  data: State | null;
}

const [useCtx, Provider] = createCtx<SetupContext>();

export const useSetupContext = useCtx;

interface Props {
  children: ReactNode;
}

/**
 * Let's talk about the Board State! The Board State describes
 * the configuration of the "board" that battleship will be
 * played on (i.e. the arrangment of pokemon in a grid). Once the
 * board is setup, it gets passed along to be used in the Game State
 * (i.e. Where the ships are, what have been hit, and what's been guessed)
 */

// interface LoadingState {
//   state: "loading";
// }

// interface ReadyState {
//   state: "ready";
//   data: {
//     pokedex: IPokedex;
//     generation: IGeneration;
//   };
// }

// type BoardState = LoadingState | ReadyState;

export function SetupProvider({ children }: Props) {
  const [setupState, setSetupState] = useState<SetupState>("loading");
  const [pokedex, setPokedex] = useState<IPokedex | null>(null);
  const [generation, setGeneration] = useState<IGeneration | null>(null);
  const [pokemon, setPokemon] = useState<IPokemon[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      // fetch all the meta information
      const genPromise = PokeAPI.Generaition.resolve(2);
      const dexPromise = PokeAPI.Pokedex.resolve("national");
      const [generation, pokedex] = await Promise.all([genPromise, dexPromise]);
      setPokedex(pokedex);
      setGeneration(generation);

      // fetch the pokemon and sort it according to the pokedex
      const pokeOrderMap = new Map<string, number>();
      pokedex.pokemon_entries.forEach((entry) => {
        pokeOrderMap.set(entry.pokemon_species.name, entry.entry_number);
      });

      const pokees = await fetchPokemonByGeneration(2);

      // const pokePromises = generation.pokemon_species.map((poke) =>
      //   PokeAPI.Pokemon.resolve(poke.name)
      // );
      // const pokees = await Promise.all(pokePromises);
      pokees.sort((a, b) => {
        const aIndex = pokeOrderMap.get(a.name);
        const bIndex = pokeOrderMap.get(b.name);
        if (aIndex && bIndex) {
          if (aIndex > bIndex) {
            return 1;
          } else if (aIndex < bIndex) {
            return -1;
          }
        }
        return 0;
      });

      setPokemon(pokees);
      setSetupState("ready");
    };
    fetchAllData();
  }, []);

  const value: SetupContext = {
    setupState,
    data: null,
  };

  if (pokedex && generation && pokemon) {
    value.data = {
      pokedex,
      generation,
      pokemon,
    };
  }

  return <Provider value={value}>{children}</Provider>;
}

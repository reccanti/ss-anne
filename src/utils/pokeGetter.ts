/**
 * This is kind of an extension of what I started with pokeFuncs.
 * The goal here is to create an wrapper around the PokeAPI that can
 * be used to simplify the process of fetching pokemon and formatting
 * it in the way I'd like.
 *
 * @TODO - Even though pokeapi-typescript caches our API requests,
 * we might want to pull all this down and host all the data locally.
 * By having this Getter, we can preserve the API our app uses while
 * swapping out the data source
 */
import PokeAPI, { IPokemonSpeciesVariety } from "pokeapi-typescript";
import memo from "micro-memoize";
import { PromiseAllSettledChunk } from "./PromiseAllChunk";
import { CoolCache } from "./CoolCache";

/**
 * All the languages that information could be
 * displayed in
 */
export type Language =
  | "ja-Hrkt"
  | "roomaji"
  | "ko"
  | "zh-Hant"
  | "fr"
  | "de"
  | "es"
  | "it"
  | "en"
  | "cs"
  | "ja"
  | "zh-Hans"
  | "pt-BR";

/**
 * The Pokemon Cache contains all the information needed to display
 * and work with Pokemon data. When needed, objects are used instead
 * of arrays in order to decrease the time needed
 */
interface IPokemonCache {
  id: string;
  nationalDexNumber: number;
  artworkUrl: string;
  names: {
    [lang in Language]: string;
  };
}

const PokemonCache = new CoolCache<IPokemonCache>(
  "pokemon",
  async (name: string) => {
    // first, look up the Pokemon species and fetch the
    // resource for its default variety
    const species = await PokeAPI.PokemonSpecies.resolve(name);
    const defaultForm = species.varieties.find(
      (variety) => variety.is_default
    ) as IPokemonSpeciesVariety;
    const pokemon = await PokeAPI.Pokemon.resolve(defaultForm.pokemon.name);

    // extract the ID, name, and artwork for the pokemon. Put it in a format
    // that's faster to search than an array
    const nationalDexNumber = pokemon.id;
    const artworkUrl = pokemon.sprites.front_default;
    const names = species.names.reduce((acc, cur) => {
      acc[cur.language.name as Language] = cur.name;
      return acc;
    }, {} as { [lang in Language]: string });

    return {
      id: name,
      nationalDexNumber,
      artworkUrl,
      names,
    };
  }
);

/**
 * The Game Cache contains all the information needed to get game-related
 * information
 */
interface IGameCache {
  id: string;
  generation: string;
  names: {
    [lang in Language]: string;
  };
  pokedex: string[];
}

const GameCache = new CoolCache<IGameCache>("games", async (title: string) => {
  // get the game and the version group that game belongs to
  const game = await PokeAPI.Version.resolve(title);
  const group = await PokeAPI.VerionGroup.resolve(game.version_group.name);

  // extract the ID, names, and pokedex and put it in a format
  // that's faster to search than an array
  const id = game.name;
  const names = game.names.reduce((acc, cur) => {
    acc[cur.language.name as Language] = cur.name;
    return acc;
  }, {} as { [lang in Language]: string });
  const pokedex = group.pokedexes.map((dex) => dex.name);
  const generation = group.generation.name;

  return {
    id,
    names,
    pokedex,
    generation,
  };
});

/**
 * The Pokedex cache is where we keep all pokedex info
 */
const makeNationalDex = memo(async (gen: string): Promise<IPokedexCache> => {
  // first get all the pokedex in each generation
  const generation = await PokeAPI.Generaition.resolve(gen);
  const groupPromises = generation.version_groups.map((group) =>
    PokeAPI.VerionGroup.resolve(group.name)
  );
  const groups = await Promise.all(groupPromises);
  const dexPromises = groups.flatMap((group) =>
    group.pokedexes.map((dex) => PokedexCache.get(dex.name))
  );
  const dexes = (await Promise.all(dexPromises)) as IPokedexCache[];

  // create a set containing the names of each unique pokemon across
  // all the dexes. This should cover scenarios like Sword and Shield,
  // where not all pokemon are present.
  const pokemonSet = new Set<string>();
  dexes.forEach((dex) => {
    dex.pokemon.forEach((poke) => {
      pokemonSet.add(poke);
    });
  });

  // we need to determine the order the pokemon should appear in, so
  // let's get all of their data, put them in a lookup map, and sort
  // them
  const lookup = new Map<string, number>();
  const pokePromises = Array.from(pokemonSet).map((poke) =>
    PokemonCache.get(poke)
  );
  const pokeResults = await PromiseAllSettledChunk(pokePromises, 100);
  const fulfilled = pokeResults.filter(
    (r) => r.status === "fulfilled"
  ) as PromiseFulfilledResult<IPokemonCache>[];
  const pokes = fulfilled.map((r) => r.value);
  pokes.forEach((poke) => {
    lookup.set(poke.id, poke.nationalDexNumber);
  });

  // get the name of the National dex for the game
  const nationalDex = (await PokedexCache.get("national")) as IPokedexCache;

  const names = nationalDex.names;
  const pokemon = Array.from(pokemonSet).sort((a, b) => {
    const aNum = lookup.get(a) as number;
    const bNum = lookup.get(b) as number;
    if (aNum > bNum) {
      return 1;
    } else if (aNum < bNum) {
      return -1;
    } else {
      return 0;
    }
  });
  const id = `national/${gen}`;

  return {
    names,
    pokemon,
    id,
  };
});

interface IPokedexCache {
  id: string;
  names: {
    [lang in Language]: string;
  };
  pokemon: string[];
}

const PokedexCache = new CoolCache<IPokedexCache>(
  "pokedex",
  async (name: string) => {
    if (name.includes("national/")) {
      const [, gen] = name.split("/");
      const cache = makeNationalDex(gen);
      return cache;
    } else {
      // get the pokedex
      const dex = await PokeAPI.Pokedex.resolve(name);

      // extract the ID, names, and pokemon and put it in a
      // format  that's faster to search than an array
      const id = dex.name;
      const names = dex.names.reduce((acc, cur) => {
        acc[cur.language.name as Language] = cur.name;
        return acc;
      }, {} as { [lang in Language]: string });
      /**
       * @NOTE this is a little complicated. What we're doing here
       * is creating list of pokemon sorted by the pokedex order,
       * which involves several steps
       */
      const pokemonEntries = dex.pokemon_entries.map((entry) => ({
        name: entry.pokemon_species.name,
        num: entry.entry_number,
      }));
      pokemonEntries.sort((a, b) => {
        if (a.num > b.num) {
          return 1;
        } else if (a.num < b.num) {
          return -1;
        } else {
          return 0;
        }
      });
      const pokemon = pokemonEntries.map((entry) => entry.name);

      return {
        id,
        names,
        pokemon,
      };
    }
  }
);

export interface PokeGeneration {
  name: string;
  id: number;
}

/**
 * Get info on all the pokemon
 */

export interface Pokemon {
  id: string;
  nationalDexNumber: number;
  name: string;
  artworkUrl: string;
}

const getPokemonByPokedex = memo(
  async (lang: Language, dexName: string): Promise<Pokemon[]> => {
    const dex = (await PokedexCache.get(dexName)) as IPokedexCache;
    const pokemonPromises = dex.pokemon.map((poke) => PokemonCache.get(poke));
    const pokemonCacheResults = await PromiseAllSettledChunk(
      pokemonPromises,
      50
    );
    const pokemonAccepted = pokemonCacheResults.filter(
      (r) => r.status === "fulfilled" && !!r.value
    ) as PromiseFulfilledResult<IPokemonCache>[];
    const pokemonCached = pokemonAccepted.map((r) => r.value);
    return pokemonCached.map((poke) => ({
      id: poke.id,
      name: poke.names[lang],
      artworkUrl: poke.artworkUrl,
      nationalDexNumber: poke.nationalDexNumber,
    }));
  }
);

/**
 * This is used to get a list of all the mainline Pokemon games
 */
export interface Game {
  id: string;
  name: string;
  generation: string;
  pokedex: string[];
}

const getAllGames = memo(async (lang: Language): Promise<Game[]> => {
  const gameResources = await PokeAPI.Version.listAll();
  const gamePromises = gameResources.results.map((res) =>
    GameCache.get(res.name)
  );
  const cachedGames = await Promise.all(gamePromises);
  const filtered = cachedGames.filter((game) => !!game) as IGameCache[];
  return (
    filtered
      // just filter out games without pokedexes because this won't work otherwise.
      // seems to be a problem for XD and Colosseum
      .filter((game) => game.pokedex.length > 0)
      // filtering out games without a name array because this won't work otherwise.
      // seems to be a problem for Let's Go and Sword & Shield
      .filter((game) => Object.keys(game.names).length > 0)
      .map((cache) => ({
        id: cache.id,
        name: cache.names[lang],
        generation: cache.generation,
        pokedex: cache.pokedex,
      }))
  );
});

/**
 * This is used to get a list of Pokedexes for each game.
 */
export interface Pokedex {
  id: string;
  name: string;
  pokemon: string[];
}

const getPokedexByGame = memo(async (lang: Language, gameName: string): Promise<
  Pokedex[]
> => {
  const game = (await GameCache.get(gameName)) as IGameCache;
  const dexNames = game.pokedex;
  const dexPromises = dexNames.map((name) => PokedexCache.get(name));
  const cachedDexes = await Promise.all(dexPromises);
  const filtered = cachedDexes.filter((dex) => !!dex) as IPokedexCache[];
  const basePokedexes = filtered.map((cache) => ({
    id: cache.id,
    name: cache.names[lang],
    pokemon: cache.pokemon,
  }));

  const nationalDexCache = await makeNationalDex(game.generation);
  const nationalDex = {
    name: nationalDexCache.names[lang],
    id: nationalDexCache.id,
    pokemon: nationalDexCache.pokemon,
  };

  return [nationalDex, ...basePokedexes];
});

/**
 * A wrapper around all of these functions which automatically sets
 * the correct language. Maybe other things in the future
 */
interface Options {
  lang: Language;
}

export class PokeGetter {
  private language: Language;

  constructor({ lang = "en" }: Options) {
    this.language = lang;
  }

  async getAllGames(): Promise<Game[]> {
    return await getAllGames(this.language);
  }

  async getPokedexByGame(game: Game): Promise<Pokedex[]> {
    return await getPokedexByGame(this.language, game.id);
  }

  async getPokemonByPokedex(dex: Pokedex): Promise<Pokemon[]> {
    return await getPokemonByPokedex(this.language, dex.id);
  }
}

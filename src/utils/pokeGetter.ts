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
 * Utility function to generate a lookup map for what generation
 * each pokemon belongs to. It's cached, so once it's been generated
 * the first time, it won't need to be called again.
 */
const makePokemonGenLookup = memo(
  async () => {
    // fetch all generations from the PokeAPI
    const gens = await PokeAPI.Generaition.listAll();
    const fetchGens = gens.results.map((gen) =>
      PokeAPI.Generaition.get(gen.name)
    );
    const genInfo = await Promise.all(fetchGens);

    // create a lookup map to associate pokemon with
    // generation
    const lookup = new Map<string, number>();
    genInfo.forEach((gen) => {
      gen.pokemon_species.forEach((poke) => {
        lookup.set(poke.name, gen.id);
      });
    });

    return lookup;
  },
  { isPromise: true }
);

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
  nationalDexNumber: number;
  artworkUrl: string;
  generation: number;
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

    // get the lookup map for all generations
    const lookup = await makePokemonGenLookup();

    // extract the ID, name, and artwork for the pokemon. Put it in a format
    // that's faster to search than an array
    const nationalDexNumber = pokemon.id;
    const artworkUrl = pokemon.sprites.front_default;
    const names = species.names.reduce((acc, cur) => {
      acc[cur.language.name as Language] = cur.name;
      return acc;
    }, {} as { [lang in Language]: string });
    const generation = lookup.get(pokemon.name) as number;

    return {
      nationalDexNumber,
      artworkUrl,
      names,
      generation,
    };
  }
);

/**
 * The Game Cache contains all the information needed to get game-related
 * information
 */
interface IGameCache {
  id: number;
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
  const id = game.id;
  const names = game.names.reduce((acc, cur) => {
    acc[cur.language.name as Language] = cur.name;
    return acc;
  }, {} as { [lang in Language]: string });
  const pokedex = group.pokedexes.map((dex) => dex.name);

  return {
    id,
    names,
    pokedex,
  };
});

export interface PokeGeneration {
  name: string;
  id: number;
}

/**
 * Fetch all the Pokemon generations
 */
async function getAllGenerations(lang: Language): Promise<PokeGeneration[]> {
  // list out all the generations
  const genList = await PokeAPI.Generaition.listAll();

  // get info from all of the generations
  const genRequests = genList.results.map((gen) =>
    PokeAPI.Generaition.resolve(gen.name)
  );
  const genInfoDump = await Promise.all(genRequests);

  // parse out that info into a list of our generations
  const gens: PokeGeneration[] = [];
  genInfoDump.forEach((gen) => {
    const genName = gen.names.find((name) => name.language.name === lang);
    if (genName) {
      gens.push({
        name: genName.name,
        id: gen.id,
      });
    }
  });

  return gens;
}

/**
 * Get info on all the pokemon available in each generation
 *
 * @TODO - This logic is incomplete and probably bad. I think this
 * is the flow I'd like to encourage:
 *
 * 1. Select the game you're playing
 * 2. Use that to find the version group
 * 3. Use that to find the generation
 * 4. Find all the pokemon-species in that generation
 * 5. Get the names of all the varieties of that species
 * 6. Look up all those varieties
 *
 * This is kind of unmanegeable in it's current form. I think
 * what I'd like to do is create a "Cache" layer that will look
 * something like this:
 *
 * {
 *   pokemon: {...},
 *   games: {...}
 * }
 *
 * The cache will work like this:
 *
 * ```
 * Cache.get("pokemon").get("crobat")
 * ```
 *
 * or
 *
 * ```
 * Cache.get("games").get("pokemon")
 * ```
 *
 * It will work like this:
 *
 * 1. Does that request exist as a memoized value in the cache?
 *    If so, return that
 * 2. Does the entry exist in the cache? If so, lookup the value
 *    and return that
 * 3. Otherwise, make a request to the PokeAPI, store the value
 *    in localstorage, and then return the result
 *
 * Maybe multiple Caches for each type would be easier to implement
 * and manage?
 *
 * ~reccanti 6/22/21
 */

export interface Pokemon {
  nationalDexNumber: number;
  name: string;
  generation: number;
  artworkUrl: string;
}

export async function getPokemonByGeneration(
  lang: Language,
  generationId: number
): Promise<Pokemon[]> {
  // based on the generation, cycle backward to get all the pokemon
  let currentGen = generationId;
  const genPromises: ReturnType<typeof PokeAPI.Generaition.resolve>[] = [];
  while (currentGen > 0) {
    genPromises.push(PokeAPI.Generaition.resolve(currentGen));
    currentGen--;
  }
  const gens = await Promise.all(genPromises);

  const pokePromises: Promise<IPokemonCache | void>[] = [];
  gens.forEach((gen) => {
    gen.pokemon_species.forEach((poke) => {
      const p = PokemonCache.get(poke.name);
      pokePromises.push(p);
    });
  });

  const res = await PromiseAllSettledChunk(pokePromises, 100);
  const pokemon: Pokemon[] = res
    .filter((r) => r.status === "fulfilled" && !!r.value)
    .map((r) => ({
      // @ts-ignore
      name: r.value.names[lang],
      // @ts-ignore
      nationalDexNumber: r.value.id,
      // @ts-ignore
      generation: r.value.generation,
      // @ts-ignore
      artworkUrl: r.value.artworkUrl,
    }));

  return pokemon;
}

/**
 * This is used to get a list of all the mainline Pokemon games
 */
export interface Game {
  id: number;
  name: string;
  pokedex: string[];
}

const getAllGames = memo(async (lang: Language): Promise<Game[]> => {
  const gameResources = await PokeAPI.Version.listAll();
  const gamePromises = gameResources.results.map((res) =>
    GameCache.get(res.name)
  );
  const cachedGames = await Promise.all(gamePromises);
  const filtered = cachedGames.filter((game) => !!game) as IGameCache[];
  return filtered.map((cache) => ({
    id: cache.id,
    name: cache.names[lang],
    pokedex: cache.pokedex,
  }));
});

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

  async getAllGenerations(): Promise<PokeGeneration[]> {
    return await getAllGenerations(this.language);
  }

  async getPokemonByGeneration(generation: PokeGeneration) {
    return await getPokemonByGeneration(this.language, generation.id);
  }
}

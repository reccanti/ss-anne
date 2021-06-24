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
import PokeAPI, {
  IPokemon,
  IPokemonSpecies,
  IPokemonSpeciesVariety,
} from "pokeapi-typescript";
import { CoolCache } from "./CoolCache";
import { PromiseAllSettledChunk } from "./PromiseAllChunk";

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

export interface Pokemon {
  id: number;
  artworkUrl: string;
  names: {
    [lang in Language]: string;
  };
}

export interface PokeGeneration {
  name: string;
  id: number;
}

const PokemonCache = new CoolCache<Pokemon>("pokemon", async (name: string) => {
  const species = await PokeAPI.PokemonSpecies.resolve(name);
  const defaultForm = species.varieties.find(
    (variety) => variety.is_default
  ) as IPokemonSpeciesVariety;
  const pokemon = await PokeAPI.Pokemon.resolve(defaultForm.pokemon.name);

  const id = pokemon.id;
  const artworkUrl = pokemon.sprites.front_default;
  const names = species.names.reduce((acc, cur) => {
    acc[cur.language.name as Language] = cur.name;
    return acc;
  }, {} as { [lang in Language]: string });

  return {
    id,
    artworkUrl,
    names,
  };
});

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

  const pokePromises: Promise<Pokemon | void>[] = [];
  gens.forEach((gen) => {
    gen.pokemon_species.forEach((poke) => {
      const p = PokemonCache.get(poke.name);
      pokePromises.push(p);
    });
  });

  const res = await PromiseAllSettledChunk(pokePromises, 100);
  const pokemon: Pokemon[] = res
    .filter((r) => r.status === "fulfilled")
    // @ts-ignore
    .map((r) => r.value)
    .filter((poke: Pokemon | void) => !!poke);

  return pokemon;

  // get the basic list of pokemon introduced in each generation
  // const pokePromises: Promise<[IPokemon, IPokemonSpecies]>[] = [];
  // gens.forEach((gen) => {
  //   gen.pokemon_species.forEach((poke) => {
  //     const p = PokeAPI.Pokemon.resolve(poke.name);
  //     const ps = PokeAPI.PokemonSpecies.resolve(poke.name);
  //     const pps = Promise.all([p, ps]);
  //     pokePromises.push(pps);
  //   });
  // });
  // const pokes = await PromiseAllSettledChunk(pokePromises, 100);

  // // format this data into the Pokemon type
  // const pokemon: Pokemon[] = [];
  // pokes.forEach((res) => {
  //   if (res.status === "fulfilled") {
  //     const [poke, species] = res.value;
  //     // const name = poke.name;
  //     const nameResource = species.names.find(
  //       (name) => name.language.name === lang
  //     );
  //     if (nameResource) {
  //       const name = nameResource.name;
  //       const id = poke.id;
  //       const artworkUrl = poke.sprites.front_default;
  //       pokemon.push({
  //         name,
  //         id,
  //         artworkUrl,
  //       });
  //     }
  //   }
  // });

  // return pokemon;
}

interface Options {
  lang: Language;
}

export class PokeGetter {
  private language: Language;

  constructor({ lang = "en" }: Options) {
    this.language = lang;
  }

  async getAllGenerations(): Promise<PokeGeneration[]> {
    return await getAllGenerations(this.language);
  }

  async getPokemonByGeneration(generation: PokeGeneration) {
    return await getPokemonByGeneration(this.language, generation.id);
  }
}

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
import PokeAPI, { IPokemon, IPokemonSpecies } from "pokeapi-typescript";

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
  name: string;
  id: number;
  artworkUrl: string;
}

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

  // get the basic list of pokemon introduced in each generation
  const pokePromises: Promise<[IPokemon, IPokemonSpecies]>[] = [];
  gens.forEach((gen) => {
    gen.pokemon_species.forEach((poke) => {
      const p = PokeAPI.Pokemon.resolve(poke.name);
      const ps = PokeAPI.PokemonSpecies.resolve(poke.name);
      const pps = Promise.all([p, ps]);
      pokePromises.push(pps);
    });
  });
  const pokes = await Promise.all(pokePromises);

  // format this data into the Pokemon type
  const pokemon: Pokemon[] = [];
  pokes.forEach(([poke, species]) => {
    // const name = poke.name;
    const nameResource = species.names.find(
      (name) => name.language.name === lang
    );
    if (nameResource) {
      const name = nameResource.name;
      const id = poke.id;
      const artworkUrl = poke.sprites.front_default;
      pokemon.push({
        name,
        id,
        artworkUrl,
      });
    }
  });

  return pokemon;
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

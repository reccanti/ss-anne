/**
 * Instead of making complicated pokeapi calls in React components,
 * let's group all that logic in this file so we have a cleaner API
 */
import PokeAPI, { IPokemon } from "pokeapi-typescript";

export async function fetchPokemonByGeneration(
  gen: number
  // options: {} = {}
): Promise<IPokemon[]> {
  const pokemonToFetch: string[] = [];
  let cur = gen;
  while (cur > 0) {
    const generation = await PokeAPI.Generaition.resolve(cur);
    generation.pokemon_species.forEach((pokemon) => {
      pokemonToFetch.push(pokemon.name);
    });
    cur -= 1;
  }
  const pokePromises = pokemonToFetch.map((pokemon) =>
    PokeAPI.Pokemon.resolve(pokemon)
  );

  const pokemon = await Promise.all(pokePromises);
  return pokemon;
}

async function fetchAllGens() {}

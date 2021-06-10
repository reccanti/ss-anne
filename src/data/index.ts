import data from "./pokemon.json";

export interface Pokedex {
  name: string;
  url: string;
}

export interface PokedexEntry {
  entry_number: number;
  pokedex: Pokedex;
}

export interface Pokemon {
  name: string;
  pokedex_numbers: PokedexEntry[];
}

export const pokemon: Pokemon[] = data;

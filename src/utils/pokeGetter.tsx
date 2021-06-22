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
import PokeAPI from "pokeapi-typescript";

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

export interface PokeGeneration {
  name: string;
  id: number;
}

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
}

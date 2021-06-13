const https = require("https");
const fs = require("fs").promises;
const path = require("path");

/**
 * GENERAL-PURPOSE FUNCTIONS
 */

/**
 * This function will fetch data from a given URL or throw an error.
 * It's async, baby!!!
 */
function getJSON(url) {
  return new Promise((resolve, reject) => {
    /**
     * This logic is copy/pasted from this article:
     * https://dev.to/isalevine/three-ways-to-retrieve-json-from-the-web-using-node-js-3c88
     */
    https
      .get(url, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          try {
            let json = JSON.parse(body);
            resolve(json);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

async function iterateBatch(batchURL, cb) {
  try {
    const json = await getJSON(batchURL);
    await cb(json);
    if (json.next) {
      await iterateBatch(json.next, cb);
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function writeToFile(file, json) {
  await fs.writeFile(file, JSON.stringify(json, null, 2));
}

/**
 * DATA-SPECIFIC FUNCTIONS
 */

async function getAllPokemon() {
  let allThePokes = [];
  try {
    await iterateBatch(
      "https://pokeapi.co/api/v2/pokemon-species?limit=250",
      async (json) => {
        const pokePromises = json.results.map((poke) => getJSON(poke.url));
        const pokeBatch = await Promise.all(pokePromises);
        allThePokes = [...allThePokes, ...pokeBatch];
      }
    );

    const file = path.join(__dirname, "src", "data", "pokemon.json");
    await writeToFile(file, allThePokes);
  } catch (error) {
    console.error("getAllPokemon");
    console.error(error.message);
  }
}

async function getAllGenerations() {
  let allTheGens = [];
  try {
    await iterateBatch("https://pokeapi.co/api/v2/generation", async (json) => {
      const genPromises = json.results.map((gen) => getJSON(gen.url));
      const genBatch = await Promise.all(genPromises);
      allTheGens = [...allTheGens, ...genBatch];
    });
    const file = path.join(__dirname, "src", "data", "generation.json");
    await writeToFile(file, allTheGens);
  } catch (error) {
    console.error("getAllGenerations");
    console.error(error.message);
  }
}

async function getAllVersionGroups() {
  let allTheGroups = [];
  try {
    await iterateBatch(
      "https://pokeapi.co/api/v2/version-group",
      async (json) => {
        const groupPromises = json.results.map((group) => getJSON(group.url));
        const groupBatch = await Promise.all(groupPromises);
        allTheGroups = [...allTheGroups, ...groupBatch];
      }
    );
    const file = path.join(__dirname, "src", "data", "group.json");
    await writeToFile(file, allTheGroups);
  } catch (error) {
    console.error("getAllVersionGroups");
    console.error(error.message);
  }
}

async function getAllDexes() {
  let allTheDexes = [];
  try {
    await iterateBatch("https://pokeapi.co/api/v2/pokedex", async (json) => {
      const dexPromises = json.results.map((dex) => getJSON(dex.url));
      const dexBatch = await Promise.all(dexPromises);
      allTheDexes = [...allTheDexes, ...dexBatch];
    });
    const file = path.join(__dirname, "src", "data", "pokedex.json");
    await writeToFile(file, allTheDexes);
  } catch (error) {
    console.error("getAllDexes");
    console.error(error.message);
  }
}

async function main() {
  try {
    await getAllPokemon();
    await getAllGenerations();
    await getAllVersionGroups();
    await getAllDexes();
  } catch (error) {
    console.error(error.message);
  }
}

main();

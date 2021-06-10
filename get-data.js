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

    const filteredPokes = allThePokes.map((poke) => ({
      name: poke.name,
      pokedex_numbers: poke.pokedex_numbers,
    }));
    const file = path.join(__dirname, "src", "data", "pokemon.json");
    await writeToFile(file, filteredPokes);
  } catch (error) {
    console.error(error.message);
  }
}

async function main() {
  try {
    await getAllPokemon();
  } catch (error) {
    console.error(error.message);
  }
}

main();

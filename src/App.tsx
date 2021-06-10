import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { pokemon } from "./data";

function JohtoList() {
  const pokes: Array<{ name: string; index: number }> = [];

  pokemon.forEach((poke) => {
    const crystalDexEntry = poke.pokedex_numbers.find(
      (dex) => dex.pokedex.name === "original-johto"
    );
    if (crystalDexEntry) {
      pokes.push({
        name: poke.name,
        index: crystalDexEntry.entry_number,
      });
    }
  });

  pokes.sort((a, b) => {
    if (a.index > b.index) {
      return 1;
    } else if (a.index < b.index) {
      return -1;
    } else {
      return 0;
    }
  });

  return (
    <ol>
      {pokes.map((poke) => (
        <li key={poke.name}>{poke.name}</li>
      ))}
    </ol>
  );
}

function App() {
  return (
    <div className="App">
      <JohtoList />
    </div>
  );
}

export default App;

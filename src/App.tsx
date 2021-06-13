import { CircularProgress } from "@material-ui/core";
import "./App.css";
import { useSetupContext, SetupProvider } from "./SetupManager";

// function JohtoList() {
//   const pokes: Array<{ name: string; index: number }> = [];

//   pokemon.forEach((poke) => {
//     const crystalDexEntry = poke.pokedex_numbers.find(
//       (dex) => dex.pokedex.name === "original-johto"
//     );
//     if (crystalDexEntry) {
//       pokes.push({
//         name: poke.name,
//         index: crystalDexEntry.entry_number,
//       });
//     }
//   });

//   pokes.sort((a, b) => {
//     if (a.index > b.index) {
//       return 1;
//     } else if (a.index < b.index) {
//       return -1;
//     } else {
//       return 0;
//     }
//   });

//   return (
//     <ol>
//       {pokes.map((poke) => (
//         <li key={poke.name}>{poke.name}</li>
//       ))}
//     </ol>
//   );
// }

/**
 * Here's the thing Imma use to filter out all those sweet sweet pokeeeez
 */
// function GenerationSelect() {
//   const [gens, setGens] = useState<string[]>([]);
//   const [currentGen, setCurrentGen] = useState<string>("");

//   useEffect(() => {
//     async function getGenerations() {
//       const genList = await PokeAPI.Generaition.listAll();
//       const genPromises = genList.results.map((gen) =>
//         PokeAPI.Generaition.resolve(gen.name)
//       );
//       const gens = await Promise.all(genPromises);
//       const genNames = gens.map((gen) => gen.name);
//       setGens(genNames);
//     }
//     getGenerations().then();
//   }, []);

//   const handleChange = (event: ChangeEvent<{ value: unknown }>) => {
//     setCurrentGen(event.target.value as string);
//   };

//   return (
//     <FormControl>
//       <InputLabel>Generation</InputLabel>
//       <Select value={currentGen} onChange={handleChange}>
//         <MenuItem value="">
//           <em>Select a Generation</em>
//         </MenuItem>
//         {gens.map((gen) => (
//           <MenuItem key={gen} value={gen}>
//             {gen}
//           </MenuItem>
//         ))}
//       </Select>
//     </FormControl>
//   );
// }

// function GenerationSelect() {
//   const { generationNames } = useBoardConfigContext();
// }

function Loader() {
  const { setupState } = useSetupContext();
  if (setupState === "loading") {
    return <CircularProgress />;
  } else {
    return <div>H</div>;
  }
}

function App() {
  return (
    <SetupProvider>
      <Loader />
    </SetupProvider>
  );
}

export default App;

import { CircularProgress, GridList, GridListTile } from "@material-ui/core";
import "./App.css";
import { useSetupContext, SetupProvider } from "./SetupManager";

function Loader() {
  const { setupState, data } = useSetupContext();
  if (
    setupState === "ready" &&
    data &&
    "pokedex" in data &&
    "generation" in data &&
    "pokemon" in data
  ) {
    return (
      <>
        <pre>{data.generation.name}</pre>
        <pre>{data.pokedex.name}</pre>
        <GridList cellHeight={160} cols={15}>
          {data.pokemon.map((pokee) => (
            <GridListTile key={pokee.sprites.front_default} cols={1}>
              <img src={pokee.sprites.front_default} alt={pokee.name} />
            </GridListTile>
          ))}
        </GridList>
      </>
    );
  } else {
    return <CircularProgress />;
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

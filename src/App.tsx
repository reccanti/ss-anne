import {
  CircularProgress,
  GridList,
  GridListTile,
  makeStyles,
} from "@material-ui/core";
import { blueGrey, red } from "@material-ui/core/colors";
import "./App.css";
import { useSetupContext, SetupProvider } from "./SetupManager";

const useStyles = makeStyles({
  tile: {
    backgroundColor: blueGrey["900"],
  },
});

function Loader() {
  const { setupState, data } = useSetupContext();
  const style = useStyles();

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
        <GridList cellHeight={80} cols={14}>
          {data.pokemon.map((pokee) => (
            /**
             * Types of tile:
             * - Not guessed
             * - Miss
             * - Your Ship
             * - Hit Ship
             */
            <GridListTile
              className={style.tile}
              key={pokee.sprites.front_default}
              cols={1}
            >
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

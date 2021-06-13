import {
  CircularProgress,
  GridList,
  GridListTile,
  makeStyles,
} from "@material-ui/core";
import { blueGrey, red } from "@material-ui/core/colors";
import "./App.css";
import { Board } from "./Board";
import { useSetupContext, SetupProvider } from "./SetupManager";

// const useStyles = makeStyles({
//   tile: {
//     backgroundColor: blueGrey["900"],
//   },
// });

function Loader() {
  const { setupState, data } = useSetupContext();
  // const style = useStyles();

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
        <Board columns={14} />
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

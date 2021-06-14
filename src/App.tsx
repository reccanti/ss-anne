import { CircularProgress } from "@material-ui/core";
import { ReactNode, useState } from "react";
import "./App.css";
import { Board, Cell, CellVariant } from "./Board";
import { useSetupContext, SetupProvider } from "./SetupManager";
import { WebRTCWrapper } from "./WebRTCWrapper";

interface CellProps {
  children: ReactNode;
}

function StatefulCell({ children }: CellProps) {
  const [clicks, setClicks] = useState<number>(0);
  const handleClick = () => {
    console.log(clicks);
    const next = (clicks + 1) % 4;
    setClicks(next);
  };
  const variants: CellVariant[] = ["unknown", "miss", "ship-unhit", "ship-hit"];
  return (
    <Cell onClick={handleClick} variant={variants[clicks]}>
      {children}
    </Cell>
  );
}

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
        <Board
          columns={14}
          items={data.pokemon}
          renderCell={(pokee) => (
            <StatefulCell key={pokee.name}>
              <img src={pokee.sprites.front_default} alt={pokee.name} />
            </StatefulCell>
          )}
        />
      </>
    );
  } else {
    return <CircularProgress />;
  }
}

/**
 * Let's start thinking about the "App State". These will be the various
 * different phases of using this application. Each phase could probably
 * be considered a mini-application
 *
 * 1. Setup - This is where you set up the board, establishing the shape
 * of the board and the order the pokemon appear in
 *
 * 2. Connection - Once the board is configured, we'll try to connect to
 * another instance that we can pass that data along to. Maybe this could
 * happen in the background of other phases?
 *
 * 3. Game - This probably consists of several sub-phases, such as ship
 * placement and actual play
 *
 * 4. PostGame - After a player wins, what happens? Do we just return to
 * the main phase or give people a chance to do another round?
 */
function App() {
  return (
    <WebRTCWrapper>
      <SetupProvider>
        <Loader />
      </SetupProvider>
    </WebRTCWrapper>
  );
}

export default App;

import { CircularProgress } from "@material-ui/core";
import { ReactNode, useState } from "react";
import "./App.css";
import { Board, Cell, CellVariant } from "./Board";
import { useSetupContext, SetupProvider } from "./SetupManager";

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

function App() {
  return (
    <SetupProvider>
      <Loader />
    </SetupProvider>
  );
}

export default App;

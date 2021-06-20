import { ReactNode, useEffect, useState } from "react";
import { CircularProgress, TextField, Box, Button } from "@material-ui/core";
import { Board, Cell, CellVariant } from "./Board";
import { useSetupContext, SetupProvider } from "./SetupManager";
import { WebRTCProvider, useWebRTCCtx } from "./WebRTCContext";

import { AllTheFuckingStateProvider } from "./AllTheFuckingState";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import "./App.css";
import { LandingPage } from "./LandingPage";

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

function Connector() {
  const { connect, addOnConnect, id } = useWebRTCCtx();
  const [peer, setPeer] = useState<string>("");

  useEffect(() => {
    addOnConnect((connection) => {
      console.log(connection);
    });
  }, [addOnConnect]);

  const handleChange = (e: any) => {
    setPeer(e.target.value);
  };

  const handleClick = () => {
    connect(peer);
  };

  return (
    <>
      <Box>{id}</Box>
      <TextField onChange={handleChange} label="Set Other ID" />
      <Button onClick={handleClick}>Connect!!!</Button>
    </>
  );
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
    // <WebRTCProvider>
    //   <SetupProvider>
    //     <Connector />
    //     <Loader />
    //   </SetupProvider>
    // </WebRTCProvider>
    <AllTheFuckingStateProvider>
      <Router>
        <Switch>
          <Route exact path="/">
            <LandingPage />
          </Route>
        </Switch>
      </Router>
    </AllTheFuckingStateProvider>
  );
}

export default App;

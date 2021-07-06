import {
  HashRouter as Router,
  Switch,
  Route,
  useHistory,
} from "react-router-dom";
import {
  Toolbar,
  AppBar,
  IconButton,
  Box,
  CircularProgress,
} from "@material-ui/core";
import { Home } from "@material-ui/icons";
import {
  AllTheFuckingStateProvider,
  AllTheFuckingStateCtx,
} from "./AllTheFuckingState";
import { PokeGetterProvider } from "./PokeGetterContext";
import { LandingPage } from "./LandingPage";
import { LobbyPage } from "./LobbyPage";
import { PeerJSProvider, initializePeerJS } from "./PeerJSContext";
import { useContext, useState, useEffect } from "react";
import PeerJS from "peerjs";
import {
  SharedData,
  initializeSharedData,
  SharedDataProvider,
} from "./SharedData";

function Debug() {
  const { dispatch } = useContext(AllTheFuckingStateCtx);
  const history = useHistory();

  const handleClear = () => {
    dispatch({ type: "clear" });
    history.push("/");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton onClick={handleClear}>
          <Home />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  const [peer, setPeer] = useState<PeerJS | null>(null);
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [err, setErr] = useState<Error | null>(null);

  // initialize PeerJS
  useEffect(() => {
    const listen = async () => {
      try {
        const p = await initializePeerJS();
        setPeer(p);
      } catch (e) {
        setErr(e);
      }
    };
    listen();
  }, []);

  // initialize shared data
  useEffect(() => {
    if (!peer) {
      return;
    }
    const listen = async () => {
      try {
        const db = initializeSharedData(peer);
        setSharedData(db);
      } catch (e) {
        setErr(e);
      }
    };
    listen();
  }, [peer]);

  if (peer && sharedData) {
    return (
      <PeerJSProvider peer={peer}>
        <SharedDataProvider db={sharedData}>
          <AllTheFuckingStateProvider>
            <PokeGetterProvider lang="en">
              <Box>
                {/**
                 * @TODO - instead of hard-coding this, it might be better
                 * to do some fancy logic to determine what the base-url
                 * actually is. This way, localhost:3000/ and reccanti.github.io/ss-anne
                 * would both work
                 *
                 * ~reccanti 6/22/2021
                 */}
                <Router basename="/ss-anne/">
                  <Debug />
                  <Switch>
                    <Route exact path="/">
                      <LandingPage />
                    </Route>
                    <Route exact path="/:peer_id">
                      <LobbyPage />
                    </Route>
                  </Switch>
                </Router>
              </Box>
            </PokeGetterProvider>
          </AllTheFuckingStateProvider>
        </SharedDataProvider>
      </PeerJSProvider>
    );
  } else if (err) {
    return <>{err.message}</>;
  } else {
    return <CircularProgress />;
  }
}

export default App;

import {
  BrowserRouter as Router,
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
import {
  PeerJSProvider,
  PeerJSStatusProvider,
  usePeerJSStatus,
} from "./PeerJSContext";
import { useContext } from "react";

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
  const status = usePeerJSStatus();
  if (status.status === "uninitialized") {
    return <CircularProgress />;
  }
  return (
    <PeerJSProvider context={status.context}>
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
            <Router basename="/ss-anne">
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
    </PeerJSProvider>
  );
}

function AppInitialization() {
  return (
    <PeerJSStatusProvider>
      <App />
    </PeerJSStatusProvider>
  );
}

export default AppInitialization;

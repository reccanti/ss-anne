import { AllTheFuckingStateProvider } from "./AllTheFuckingState";
import { PokeGetterProvider } from "./PokeGetterContext";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { LandingPage } from "./LandingPage";
import { LobbyPage } from "./LobbyPage";
import { PeerJSProvider } from "./PeerJSContext";

function App() {
  return (
    <PeerJSProvider>
      <AllTheFuckingStateProvider>
        <PokeGetterProvider lang="en">
          {/**
           * @TODO - instead of hard-coding this, it might be better
           * to do some fancy logic to determine what the base-url
           * actually is. This way, localhost:3000/ and reccanti.github.io/ss-anne
           * would both work
           *
           * ~reccanti 6/22/2021
           */}
          <Router basename="/ss-anne">
            <Switch>
              <Route exact path="/">
                <LandingPage />
              </Route>
              <Route exact path="/:peer_id">
                <LobbyPage />
              </Route>
            </Switch>
          </Router>
        </PokeGetterProvider>
      </AllTheFuckingStateProvider>
    </PeerJSProvider>
  );
}

export default App;

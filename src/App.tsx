import { AllTheFuckingStateProvider } from "./AllTheFuckingState";
import { PokeGetterProvider } from "./PokeGetterContext";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import "./App.css";
import { LandingPage } from "./LandingPage";
import { LobbyPage } from "./LobbyPage";

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
  );
}

export default App;

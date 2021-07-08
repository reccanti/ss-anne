/**
 * This is the landing page for the application. This is where the
 * user sets their username and launches their instance. I'm modeling
 * it basically on the landing screen for https://skribbl.io/ since
 * I think it does a really good job!
 */

import {
  Paper,
  TextField,
  Button,
  makeStyles,
  FormControl,
  Input,
  InputLabel,
  Grid,
} from "@material-ui/core";
import { useContext, useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useHistory } from "react-router";
import { AllTheFuckingStateCtx } from "./AllTheFuckingState";
import { usePeerJS } from "./PeerJSContext";
import { PokeGetterContext } from "./PokeGetterContext";
import { Game, Pokedex, Pokemon } from "./utils/pokeGetter";
import { BetterSelect } from "./utils/BetterSelect";
import { BoardContainer, Board, Cell } from "./Board";
import { CreateUser } from "./CreateUserPage";
import { useSharedData } from "./SharedData";

/**
 * This is where we'll set up the board for an upcoming game.
 *
 * @TODO - This thing is doing so much. It's really bad. A good
 * first step would be moving this to it's own page. Later,
 * it might be a good idea to break out some of the state
 * management into hooks
 *
 * ~reccanti 6/28/2021
 */

const useBoardStyles = makeStyles({
  root: {
    padding: "1rem",
    maxWidth: "350px",
    margin: "1rem",
    "& form > *:not(:first-child)": {
      marginTop: "1rem",
    },
  },
  image: {
    pointerEvents: "none",
  },
});

// container component for managing board state. Makes sure
// PeerJS is initialized and manages state for the Board
function BoardSetupManager() {
  // hooks

  const [games, setGames] = useState<Game[]>([]);
  const [dexes, setDexes] = useState<Pokedex[]>([]);
  const { state, dispatch } = useContext(AllTheFuckingStateCtx);
  const getter = useContext(PokeGetterContext);

  const history = useHistory();

  const peer = usePeerJS();

  useEffect(() => {
    const fetch = async () => {
      const games = await getter.getAllGames();
      setGames(games);
    };
    fetch();
  }, [getter]);

  useEffect(() => {
    const fetch = async () => {
      const dexes = await getter.getPokedexByGame(state.board.game);
      setDexes(dexes);
    };
    fetch();
  }, [getter, dispatch, state.board.game]);

  useEffect(() => {
    const fetch = async () => {
      const pokemon = await getter.getPokemonByPokedex(state.board.pokedex);
      dispatch({ type: "setBoardPokemon", payload: pokemon });
    };
    fetch();
  }, [getter, dispatch, state.board.pokedex]);

  // If PeerJS is ready, initialize all the handler functions,
  // setup state management, and render the board
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    dispatch({ type: "setBoardName", payload: { name } });
  };

  const handleColumnChange = (event: ChangeEvent<HTMLInputElement>) => {
    const columns = Number(event.target.value);
    dispatch({ type: "setBoardColumns", payload: { columns } });
  };

  const handleGameChange = (game: Game) => {
    dispatch({ type: "setBoardGame", payload: game });
  };

  const handlePokedexChange = (dex: Pokedex) => {
    dispatch({ type: "setBoardPokedex", payload: dex });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (peer.id) {
      history.push(`/${peer.id}`);
    }
  };

  // fetch state
  return (
    <BoardSetup
      curName={state.board.name}
      curColumn={state.board.columns}
      curGame={state.board.game}
      curPokedex={state.board.pokedex}
      curPokemon={state.board.pokemon}
      games={games}
      pokedex={dexes}
      onNameChange={handleNameChange}
      onColumnChange={handleColumnChange}
      onGameChange={handleGameChange}
      onPokedexChange={handlePokedexChange}
      onSubmit={handleSubmit}
    />
  );
}

/**
 * @TODO - After writing this type definition, I realized that it would
 * probably be better to break these up into individual "presentation"
 * components that could better handle the abstracting-away the DOM
 * events and would make it so that we don't have to create a million
 * "onTypeChange" props. I think it still makes sense to handle  state
 * and composition in a single component, since that would allow us to
 * better coordinate asynchronous data
 *
 * ~reccanti 7/3/2021
 */
interface BoardSetupProps {
  curName: string;
  curColumn: number;
  curGame: Game;
  curPokedex: Pokedex;
  games: Game[];
  pokedex: Pokedex[];
  curPokemon: Pokemon[];
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onColumnChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onGameChange: (game: Game) => void;
  onPokedexChange: (dex: Pokedex) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}
function BoardSetup(props: BoardSetupProps) {
  const styles = useBoardStyles();

  // render

  return (
    <Grid container>
      <Grid container item xs={2}>
        <Paper className={styles.root}>
          <form onSubmit={props.onSubmit}>
            <TextField
              fullWidth
              label="Board Name"
              onChange={props.onNameChange}
              value={props.curName}
            />
            <FormControl fullWidth>
              <InputLabel htmlFor="column-input">Columns</InputLabel>
              <Input
                id="column-input"
                type="number"
                onChange={props.onColumnChange}
                value={props.curColumn}
              />
            </FormControl>
            <BetterSelect
              id="game-select"
              label="Game"
              fullWidth
              data={props.games}
              value={props.curGame}
              getDisplayValue={(d) => d.name}
              getKeyValue={(d) => d.id}
              getValue={(d) => d.id}
              onChange={props.onGameChange}
            />
            <BetterSelect
              id="pokedex-select"
              label="Pokedex"
              fullWidth
              data={props.pokedex}
              value={props.curPokedex}
              getDisplayValue={(d) => d.name}
              getKeyValue={(d) => d.id}
              getValue={(d) => d.id}
              onChange={props.onPokedexChange}
            />
            <Button type="submit" fullWidth>
              Get Started!
            </Button>
          </form>
        </Paper>
      </Grid>
      <Grid container item xs={10}>
        <BoardContainer>
          <Board
            columns={props.curColumn}
            items={props.curPokemon}
            renderCell={(item) => (
              <Cell key={item.name} variant="unknown">
                <img
                  className={styles.image}
                  src={item.artworkUrl}
                  alt={item.name}
                />
              </Cell>
            )}
          />
        </BoardContainer>
      </Grid>
    </Grid>
  );
}

export function LandingPage() {
  const { state } = useContext(AllTheFuckingStateCtx);
  const peer = usePeerJS();
  const { joinWaiting } = useSharedData();

  const handleSubmit = ({ name }: { name: string }) => {
    const player = {
      name,
      id: peer.id,
    };
    joinWaiting(player);
  };

  if (state.user) {
    return <BoardSetupManager />;
  }
  return <CreateUser onSubmit={handleSubmit} />;
}

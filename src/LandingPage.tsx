/**
 * This is the landing page for the application. This is where the
 * user sets their username and launches their instance. I'm modeling
 * it basically on the landing screen for https://skribbl.io/ since
 * I think it does a really good job!
 */

import {
  Paper,
  Container,
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
import { PokeGetterContext } from "./PokeGetterContext";
import { Game, Pokedex } from "./utils/pokeGetter";
import { BetterSelect } from "./utils/BetterSelect";
import { BoardContainer, Board, Cell } from "./Board";
import { usePeerJS } from "./usePeerJS";

/**
 * This is a sub-page of the landing page. Here, we ask the user to
 * select a username before either creating their board or joining
 * someone at a particular instance.
 *
 * @TODO - right now, we only allow the user to create a new board.
 * Users will be able to join directly using a URL provided by the
 * other player once their board is created.
 *
 * ~reccanti 6/20/2021
 */
const useCreateStyles = makeStyles({
  root: {
    padding: "1rem",
    margin: "1rem",
    "& *:not(:first-child)": {
      marginTop: "1rem",
    },
  },
});

interface FormState {
  name: string;
}

function CreateUser() {
  const styles = useCreateStyles();

  /**
   * @TOOD - Using this to initialize PeerJS, since I don't know
   * of a better place to put it. This might require a refactor
   * of how the `usePeerJS` hook
   *
   * ~reccanti 6/28/2021
   */
  usePeerJS();

  const { dispatch } = useContext(AllTheFuckingStateCtx);
  const [state, setState] = useState<FormState>({ name: "" });

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      name: event.target.value,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: "setPlayer", payload: { name: state.name } });
    dispatch({
      type: "setBoardName",
      payload: { name: `${state.name}'s board` },
    });
  };

  return (
    <Container fixed maxWidth="sm">
      <Paper className={styles.root}>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Display Name"
            onChange={handleNameChange}
            value={state.name}
            fullWidth
          />
          <Button type="submit" fullWidth>
            Get Started
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

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

function BoardSetup() {
  // hooks

  const [games, setGames] = useState<Game[]>([]);
  const [dexes, setDexes] = useState<Pokedex[]>([]);

  const { state, dispatch } = useContext(AllTheFuckingStateCtx);
  const getter = useContext(PokeGetterContext);

  const history = useHistory();

  const styles = useBoardStyles();

  // handlers

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
    if (state.peerjs) {
      const id = state.peerjs.id;
      history.push(`/${id}`);
    }
  };

  // fetch state

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

  // render

  return (
    <Grid container>
      <Grid container item xs={2}>
        <Paper className={styles.root}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Board Name"
              onChange={handleNameChange}
              value={state.board.name}
            />
            <FormControl fullWidth>
              <InputLabel htmlFor="column-input">Columns</InputLabel>
              <Input
                id="column-input"
                type="number"
                onChange={handleColumnChange}
                value={state.board.columns}
              />
            </FormControl>
            <BetterSelect
              id="game-select"
              label="Game"
              fullWidth
              data={games}
              value={state.board.game}
              getDisplayValue={(d) => d.name}
              getKeyValue={(d) => d.id}
              getValue={(d) => d.id}
              onChange={handleGameChange}
            />
            <BetterSelect
              id="pokedex-select"
              label="Pokedex"
              fullWidth
              data={dexes}
              value={state.board.pokedex}
              getDisplayValue={(d) => d.name}
              getKeyValue={(d) => d.id}
              getValue={(d) => d.id}
              onChange={handlePokedexChange}
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
            columns={state.board.columns}
            items={state.board.pokemon}
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
  if (state.users.player) {
    return <BoardSetup />;
  }
  return <CreateUser />;
}

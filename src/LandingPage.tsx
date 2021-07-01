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
import { Game, Pokedex } from "./utils/pokeGetter";
import { BetterSelect } from "./utils/BetterSelect";
import { BoardContainer, Board, Cell } from "./Board";
import { CreateUser } from "./CreateUserPage";

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

  const { peer } = usePeerJS();

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
    if (peer) {
      const id = peer.id;
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
  if (state.user) {
    return <BoardSetup />;
  }
  return <CreateUser />;
}

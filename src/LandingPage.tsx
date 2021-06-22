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
import { AllTheFuckingStateCtx } from "./AllTheFuckingState";
import { PokeGetterContext } from "./PokeGetterContext";
import { PokeGeneration } from "./utils/pokeGetter";
import { BetterSelect } from "./utils/BetterSelect";
import { BoardContainer, Board, Cell } from "./Board";

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
 * This is where we'll set up the board for an upcoming game
 */

const useBoardStyles = makeStyles({
  root: {
    padding: "1rem",
    maxWidth: "350px",
    margin: "1rem",
    "& > *:not(:first-child)": {
      marginTop: "1rem",
    },
  },
});

function BoardSetup() {
  const [gens, setGens] = useState<PokeGeneration[]>([]);

  const { state, dispatch } = useContext(AllTheFuckingStateCtx);
  const getter = useContext(PokeGetterContext);

  const styles = useBoardStyles();

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    dispatch({ type: "setBoardName", payload: { name } });
  };

  const handleColumnChange = (event: ChangeEvent<HTMLInputElement>) => {
    const columns = Number(event.target.value);
    dispatch({ type: "setBoardColumns", payload: { columns } });
  };

  const handleGenChange = (gen: PokeGeneration) => {
    dispatch({ type: "setBoardGeneration", payload: gen });
  };

  useEffect(() => {
    const fetch = async () => {
      const gens = await getter.getAllGenerations();
      setGens(gens);
    };
    fetch();
  }, [getter]);

  useEffect(() => {
    const fetch = async () => {
      const pokes = await getter.getPokemonByGeneration(state.board.generation);
      dispatch({ type: "setBoardPokemon", payload: pokes });
    };
    fetch();
  }, [getter, state.board.generation]);

  return (
    <Grid container>
      <Grid container item xs={2}>
        <Paper component="form" className={styles.root}>
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
            id="gen-select"
            label="Generation"
            fullWidth
            data={gens}
            value={state.board.generation}
            getDisplayValue={(d) => d.name}
            getKeyValue={(d) => d.name}
            getValue={(d) => d.id}
            onChange={handleGenChange}
          />
        </Paper>
      </Grid>
      <Grid container item xs={10}>
        <BoardContainer>
          <Board
            columns={state.board.columns}
            items={state.board.pokemon}
            renderCell={(item) => (
              <Cell key={item.name} variant="unknown">
                <img src={item.artworkUrl} alt={item.name} />
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

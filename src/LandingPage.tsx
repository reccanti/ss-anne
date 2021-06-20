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
} from "@material-ui/core";
import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AllTheFuckingStateCtx } from "./AllTheFuckingState";

const useStyles = makeStyles({
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

function CreateGame() {
  const styles = useStyles();
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

export function LandingPage() {
  const { state } = useContext(AllTheFuckingStateCtx);
  if (state.users.player) {
    return <pre>{state.users.player.name}'s board</pre>;
  }
  return <CreateGame />;
}

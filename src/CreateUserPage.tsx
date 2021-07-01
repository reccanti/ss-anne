import { useState, useContext, ChangeEvent, FormEvent } from "react";
import {
  makeStyles,
  Container,
  Paper,
  TextField,
  Button,
} from "@material-ui/core";
import { AllTheFuckingStateCtx } from "./AllTheFuckingState";

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

export function CreateUser() {
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
    dispatch({ type: "setUser", payload: { name: state.name } });
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

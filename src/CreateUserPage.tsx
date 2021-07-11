import { useState, useContext, ChangeEvent, FormEvent } from "react";
import {
  makeStyles,
  Container,
  Paper,
  TextField,
  Button,
} from "@material-ui/core";
import { LocalStateContext } from "./LocalState";

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

interface CreateUserProps {
  onNameChange?: (name: string) => void;
  onSubmit?: (data: { name: string }) => void;
}

export function CreateUser(props: CreateUserProps) {
  const styles = useCreateStyles();
  const { dispatch } = useContext(LocalStateContext);
  const [state, setState] = useState<FormState>({ name: "" });

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (props.onNameChange) {
      props.onNameChange(event.target.value);
    }
    setState({
      ...state,
      name: event.target.value,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (props.onSubmit) {
      props.onSubmit({ name: state.name });
    }
    dispatch({ type: "setUser", payload: { name: state.name } });
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

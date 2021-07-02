import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  makeStyles,
  Grid,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { AllTheFuckingStateCtx } from "./AllTheFuckingState";
import { CreateUser } from "./CreateUserPage";
import { usePeerJS } from "./PeerJSContext";

/**
 * @TODO - It might make sense to move this to a separate file.
 * This will probably be important for pages other than the
 * JoinPage
 *
 * ~reccanti 7/1/2021
 */
interface BaseMessage {
  type: string;
  id: string;
}

interface UserJoined extends BaseMessage {
  type: "userJoined";
  id: string;
  payload: {
    name: string;
  };
}

type Action = UserJoined;

function parseData(data: any): Action | null {
  if (data && data.type) {
    switch (data.type) {
      case "userJoined":
        return data as Action;
    }
  }
  return null;
}

type ActionCallback = (action: Action) => void;

interface ActionListenerHook {
  registerActionListener: (listener: ActionCallback) => void;
  sendAction: (id: string, action: Action) => void;
}

function useActionListener(): ActionListenerHook {
  const actionCallbacks = useMemo(() => new Set<ActionCallback>(), []);
  const { registerOnError, registerOnData, messageById } = usePeerJS();

  const sendAction = (id: string, action: Action) => messageById(id, action);
  const registerActionListener = (listener: ActionCallback) => {
    console.log("registering...");
    actionCallbacks.add(listener);
  };

  registerOnError((err) => {
    console.log(err);
  });

  registerOnData((d) => {
    const action = parseData(d);
    if (action) {
      actionCallbacks.forEach((cb) => {
        cb(action);
      });
    }
  });

  return {
    registerActionListener,
    sendAction,
  };
}

/**
 * The page where users can join a game
 */

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4),
    "& > *:not(:first-child)": {
      marginTop: theme.spacing(2),
    },
  },
  button: {
    margin: theme.spacing(1),
    marginLeft: theme.spacing(4),
  },
  cardGrid: {
    marginTop: theme.spacing(2),
  },
  card: {
    width: "100%",
  },
}));

function JoinPage() {
  const styles = useStyles();

  const [waitingUsers, setWaitingUsers] = useState<string[]>([]);
  const { sendAction, registerActionListener } = useActionListener();

  const addWatingUser = useMemo(
    () => (user: string) => {
      setWaitingUsers((w) => [...w, user]);
    },
    []
  );

  useEffect(() => {
    registerActionListener((action: Action) => {
      // console.log("an action!!!");
      // console.log(action);
      switch (action.type) {
        case "userJoined": {
          addWatingUser(action.payload.name);
        }
      }
    });
  }, [registerActionListener, addWatingUser]);

  // connect to the person whose client you were
  // linked to
  const { id, connect, registerOnConnect } = usePeerJS();
  const { peer_id } = useParams<{ peer_id: string }>();
  const { state } = useContext(AllTheFuckingStateCtx);
  useEffect(() => {
    registerOnConnect((c) => {
      if (id && state.user) {
        connect(c.peer);
        console.log("sending action 'userJoined'");
        sendAction(c.peer, {
          type: "userJoined",
          id,
          payload: {
            name: state.user.name,
          },
        });
      }
    });
  }, [peer_id, id, registerOnConnect, sendAction, state.user, connect]);
  useEffect(() => {
    if (id && peer_id !== id) {
      connect(peer_id);
    }
  }, [peer_id, connect, id]);

  return (
    <Container className={styles.root}>
      {/* Section for adding Players */}
      <Box component="section">
        <Box display="flex">
          <Typography variant="h3" component="h1">
            Players
          </Typography>
          <Button
            className={styles.button}
            color="primary"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Join
          </Button>
        </Box>
        <Grid className={styles.cardGrid} container>
          <Grid container item xs={2}>
            <Card className={styles.card}>
              <CardContent>Testing...</CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      {/*
       * Section for people hanging out. This is to ensure we're
       * connecting through PeerJS
       */}
      <Box component="section">
        <Box display="flex">
          <Typography variant="h3" component="h1">
            Hanging Out
          </Typography>
        </Box>
        <Grid className={styles.cardGrid} container>
          {waitingUsers.map((user, index) => (
            // This is a bad key. Store better info in the User
            <Grid key={`${user}_${index}`} container item xs={2}>
              <Card className={styles.card}>
                <CardContent>{user}</CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      {/* Ready Button */}
      <Box>
        <Button fullWidth variant="contained" color="primary">
          Start Game
        </Button>
      </Box>
    </Container>
  );
}

export function LobbyPage() {
  const { state } = useContext(AllTheFuckingStateCtx);

  if (!state.user) {
    return <CreateUser />;
  }
  return <JoinPage />;
}

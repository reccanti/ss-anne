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

interface RequestJoin extends BaseMessage {
  type: "requestJoin";
  id: string;
  payload: {
    name: string;
  };
}

interface JoinReceived extends BaseMessage {
  type: "joinReceived";
  id: string;
  payload: {
    name: string;
  };
}

type Action = RequestJoin | JoinReceived;

type ActionCallback = (action: Action) => void;

function parseData(data: any): Action | null {
  if (data && data.type) {
    switch (data.type) {
      case "requestJoin":
      case "joinReceived":
        return data as Action;
    }
  }
  return null;
}

interface ActionListenerHook {
  registerActionListener: (listener: ActionCallback) => void;
  sendAction: (id: string, action: Action) => void;
}

function useActionListener(): ActionListenerHook {
  const actionCallbacks = useMemo(() => new Set<ActionCallback>(), []);
  const { registerOnError, registerOnData, messageById } = usePeerJS();

  const sendAction = useMemo(
    () => (id: string, action: Action) => messageById(id, action),
    [messageById]
  );

  const registerActionListener = useMemo(
    () => (listener: ActionCallback) => {
      console.log(actionCallbacks.size);
      actionCallbacks.add(listener);
    },
    [actionCallbacks]
  );

  useEffect(() => {
    registerOnError((err) => {
      console.log(err);
    });

    registerOnData((d) => {
      const action = parseData(d);
      console.log("that's an action!!!");
      if (action) {
        actionCallbacks.forEach((cb) => {
          cb(action);
        });
      }
    });
  }, [actionCallbacks, registerOnData, registerOnError]);

  return {
    registerActionListener,
    sendAction,
  };
}

/**
 * The lobby page where the user can join a page
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

interface JoinPageProps {
  waitingUsers: string[];
}

function JoinPage(props: JoinPageProps) {
  const styles = useStyles();

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
          {props.waitingUsers.map((user, index) => (
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
  const [waitingUsers, setWaitingUsers] = useState<string[]>([]);

  const addWatingUser = useMemo(
    () => (user: string) => {
      setWaitingUsers((w) => [...w, user]);
    },
    []
  );

  const { id, connect, isConnected } = usePeerJS();
  const { peer_id } = useParams<{ peer_id: string }>();
  const { state } = useContext(AllTheFuckingStateCtx);
  const { sendAction, registerActionListener } = useActionListener();

  const handleSubmit = ({ name }: { name: string }) => {
    sendAction(peer_id, {
      type: "requestJoin",
      id,
      payload: {
        name,
      },
    });
  };

  // here, we listen for PeerJS actions
  useEffect(() => {
    registerActionListener((action: Action) => {
      switch (action.type) {
        case "joinReceived": {
          addWatingUser(action.payload.name);
          break;
        }
        case "requestJoin": {
          addWatingUser(action.payload.name);
          if (state.user) {
            sendAction(action.id, {
              type: "joinReceived",
              id,
              payload: { name: state.user.name },
            });
          }
          break;
        }
      }
    });
  }, [registerActionListener, addWatingUser, id, sendAction, state.user]);

  useEffect(() => {
    const listen = async () => {
      try {
        if (state.user && peer_id !== id) {
          if (!isConnected(peer_id)) {
            const conn = await connect(peer_id);
            console.log("sending the action...");
            sendAction(conn.peer, {
              type: "requestJoin",
              id,
              payload: { name: state.user.name },
            });
          }
        }
      } catch (err) {
        console.log(err);
      }
    };
    listen();
  }, [sendAction, connect, id, isConnected, peer_id, state.user]);

  if (!state.user) {
    return <CreateUser onSubmit={handleSubmit} />;
  }
  return <JoinPage waitingUsers={waitingUsers} />;
}

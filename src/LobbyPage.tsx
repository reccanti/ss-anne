import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  makeStyles,
  Grid,
  CircularProgress,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { AllTheFuckingStateCtx } from "./AllTheFuckingState";
import { CreateUser } from "./CreateUserPage";
import { usePeerJS } from "./PeerJSContext";
import { useSharedData } from "./sharedData";

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

function JoinPage() {
  const styles = useStyles();
  const { state } = useSharedData();

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
          {state.waiting.map((player) => (
            // This is a bad key. Store better info in the User
            <Grid key={player.id} container item xs={2}>
              <Card className={styles.card}>
                <CardContent>{player.name}</CardContent>
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
  const [isReady, setIsReady] = useState<boolean>(false);

  const peer = usePeerJS();
  const { joinWaiting, clone } = useSharedData();
  const { state } = useContext(AllTheFuckingStateCtx);
  const { peer_id } = useParams<{ peer_id: string }>();

  useEffect(() => {
    async function listen() {
      if (peer.id !== peer_id) {
        await clone(peer_id);
      }
      setIsReady(true);
    }
    listen();
    return () => setIsReady(false);
  }, [peer_id, peer.id, clone]);

  const handleSubmit = ({ name }: { name: string }) => {
    const player = {
      name,
      id: peer.id,
    };
    joinWaiting(player);
  };

  if (!isReady) {
    return <CircularProgress />;
  } else if (!state.user) {
    return <CreateUser onSubmit={handleSubmit} />;
  }
  return <JoinPage />;
}

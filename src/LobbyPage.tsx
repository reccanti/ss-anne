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
import { useContext, useEffect } from "react";
import { useParams } from "react-router";
import { AllTheFuckingStateCtx } from "./AllTheFuckingState";
import { CreateUser } from "./CreateUserPage";
import { usePeerJS } from "./PeerJSContext";

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
  // readyButton: {
  //   marginTop: theme.spacing(2),
  // },
}));

function JoinPage() {
  const styles = useStyles();

  /**
   * Listen for new users
   */
  const {
    registerOnConnect,
    registerOnError,
    registerOnOpen,
    registerOnData,
    messageAll,
    connect,
  } = usePeerJS();
  const { peer_id } = useParams<{ peer_id: string }>();

  registerOnConnect((c) => {
    console.log("Connected");
    console.log(c);
    messageAll("Hey, you've been connected!!!");
    console.log("sending data...");
    c.send({ message: "Some data..." });
  });
  registerOnError((err) => {
    console.log("Error");
    console.log(err);
  });
  registerOnOpen((p) => {
    console.log("Opened!!!");
    console.log(p);
  });
  registerOnData((d) => {
    console.log("some data");
    console.log(d);
  });

  useEffect(() => {
    connect(peer_id);
  }, [peer_id, connect]);

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
          <Grid container item xs={2}>
            <Card className={styles.card}>
              <CardContent>Testing...</CardContent>
            </Card>
          </Grid>
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

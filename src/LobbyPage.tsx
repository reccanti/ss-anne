import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  makeStyles,
  Avatar,
  useTheme,
} from "@material-ui/core";
import { Add } from "@material-ui/icons";
import { useMemo, useCallback } from "react";
import { useLocalState } from "./LocalState";
import { creators, useSharedData } from "./sharedData";
import { Player } from "./sharedData/users";

// displays a list avatars for all the people who are waiting

function WaitingList() {
  const { state } = useSharedData();
  const theme = useTheme();

  return (
    <Box display="flex" gridGap={theme.spacing(1)}>
      {state.users.waiting.map((user) => (
        <Avatar key={user.id} alt={user.name}>
          {user.name.slice(0, 2)}
        </Avatar>
      ))}
    </Box>
  );
}

function PlayingList() {
  const theme = useTheme();

  const { state: sharedState, update } = useSharedData();
  const { state: localState } = useLocalState();

  const isCurrentUser = useCallback(
    (player: Player) => {
      const user = localState.user;
      if (!user) {
        return false;
      }
      const match = player.id === user.id;
      return match;
    },
    [localState.user]
  );

  // determine whether the current user is playing
  const isPlaying = useMemo(() => {
    const user = localState.user;
    if (!user) {
      return false;
    }
    const match = !!sharedState.users.players.find(
      (player) => player.id === user.id
    );
    return match;
  }, [sharedState.users.players, localState.user]);

  // function to join the game
  const join = useCallback(() => {
    const user = localState.user;
    if (user) {
      update(creators.users.joinPlaying(user));
    }
  }, [localState.user, update]);

  const leave = useCallback(() => {
    const user = localState.user;
    if (user) {
      update(creators.users.leavePlaying(user.id));
    }
  }, [localState.user, update]);

  return (
    <Grid container spacing={2}>
      {!isPlaying && (
        <Grid
          container
          item
          xs={2}
          component={Button}
          color="primary"
          variant="contained"
          startIcon={<Add />}
          onClick={join}
        >
          Join
        </Grid>
      )}
      {sharedState.users.players.map((player) => (
        <Grid key={player.id} container item xs={2} component={Card}>
          <CardContent>
            <Box display="flex" alignItems="center" gridGap={theme.spacing(1)}>
              <Avatar alt={player.name}>{player.name.slice(0, 2)}</Avatar>
              <Typography>{player.name}</Typography>
            </Box>
          </CardContent>
          {isCurrentUser(player) && (
            <Button fullWidth onClick={leave}>
              <Typography color="error">Leave</Typography>
            </Button>
          )}
        </Grid>
      ))}
    </Grid>
  );
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

export function LobbyPage() {
  const styles = useStyles();

  return (
    <Container className={styles.root}>
      {/* Section for adding Players */}
      <Box component="section">
        <Typography variant="h6" component="h1">
          Hanging Out
        </Typography>
        <WaitingList />
      </Box>
      <Box component="section">
        <Box display="flex">
          <Typography variant="h6" component="h1">
            Players
          </Typography>
        </Box>
        <Grid className={styles.cardGrid} container>
          <PlayingList />
        </Grid>
      </Box>
    </Container>
  );
}

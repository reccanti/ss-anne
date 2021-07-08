import PeerJS from "peerjs";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { WebRTCDatabase } from "../utils/WebRTCDatabase";
import { useContext } from "react";

interface Player {
  id: string;
  name: string;
}

// state

interface State {
  players: [] | [Player] | [Player, Player];
  waiting: Player[];
}

// actions

interface BaseAction {
  type: string;
}

interface JoinWaiting extends BaseAction {
  type: "joinWaiting";
  player: Player;
}

interface LeaveWaiting extends BaseAction {
  type: "leaveWaiting";
  id: string;
}

interface JoinPlaying extends BaseAction {
  type: "joinPlaying";
  player: Player;
}

interface LeavePlaying extends BaseAction {
  type: "leavePlaying";
  id: string;
}

type Action = JoinWaiting | LeaveWaiting | JoinPlaying | LeavePlaying;

// DB Type

export type SharedData = WebRTCDatabase<State, Action>;

// reducer

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "joinWaiting": {
      return {
        ...state,
        waiting: [...state.waiting, action.player],
      };
    }
    case "leaveWaiting": {
      return {
        ...state,
        waiting: state.waiting.filter((w) => w.id !== action.id),
      };
    }
    case "joinPlaying": {
      let newPlayers: [] | [Player] | [Player, Player] = [];
      switch (state.players.length) {
        case 0: {
          newPlayers = [action.player];
          break;
        }
        case 1: {
          newPlayers = [...state.players, action.player];
          break;
        }
        default: {
          throw Error("There can only be 2 players in a game");
        }
      }
      return {
        ...state,
        waiting: state.waiting.filter((w) => w.id !== action.player.id),
        players: newPlayers,
      };
    }
    case "leavePlaying": {
      const player = state.players.find((p) => p.id === action.id);
      if (player) {
        return {
          ...state,
          waiting: [...state.waiting, player],
          players: state.players.filter((player) => player.id !== action.id) as
            | []
            | [Player],
        };
      }
      return state;
    }
    default: {
      return state;
    }
  }
}

// function to create the database

export function initializeSharedData(peer: PeerJS): SharedData {
  const initialState: State = {
    players: [],
    waiting: [],
  };
  const db = new WebRTCDatabase(initialState, reducer, peer);
  return db;
}

// Base SharedDataContext

const SharedDataContext = createContext<null | SharedData>(null);

interface SharedDataInterface {
  // methods for interacting with data
  joinWaiting: (player: Player) => void;
  leaveWaiting: (id: string) => void;
  joinPlaying: (player: Player) => void;
  leavePlaying: (id: string) => void;

  // state
  state: State;

  // connection
  clone: (id: string) => Promise<void>;
}

function useBaseSharedData(): SharedData {
  const db = useContext(SharedDataContext);
  if (!db) {
    throw new Error("useSharedData must be used within a SharedDataProvider");
  }
  return db;
}

export function useSharedData(): SharedDataInterface {
  const db = useBaseSharedData();

  // handle state changes
  const [state, setState] = useState<State>(db.getState());
  useEffect(() => {
    function handleChange(state: State) {
      setState(state);
    }
    db.registerOnChange(handleChange);
    return () => db.removeOnChange(handleChange);
  }, [db]);

  // helpful callbacks
  const joinWaiting = useCallback(
    (player: Player) => {
      db.update({ type: "joinWaiting", player });
    },
    [db]
  );

  const leaveWaiting = useCallback(
    (id: string) => {
      db.update({ type: "leaveWaiting", id });
    },
    [db]
  );

  const joinPlaying = useCallback(
    (player: Player) => {
      db.update({ type: "joinPlaying", player });
    },
    [db]
  );

  const leavePlaying = useCallback(
    (id) => {
      db.update({ type: "leavePlaying", id });
    },
    [db]
  );

  const clone = useCallback(
    async (id: string) => {
      await db.clone(id);
    },
    [db]
  );

  // automatically leave on Disconnect
  useEffect(() => {
    const handleDisconnect: Parameters<typeof db.registerOnDisconnect>[0] = (
      conn
    ) => {
      leaveWaiting(conn.connection.peer);
    };
    db.registerOnDisconnect(handleDisconnect);
    return () => db.removeOnDisconnect(handleDisconnect);
  }, [db, leaveWaiting]);

  return {
    state,
    joinWaiting,
    leaveWaiting,
    joinPlaying,
    leavePlaying,
    clone,
  };
}

interface Props {
  children: ReactNode;
  db: SharedData;
}

export function SharedDataProvider({ children, db }: Props) {
  return (
    <SharedDataContext.Provider value={db}>
      {children}
    </SharedDataContext.Provider>
  );
}

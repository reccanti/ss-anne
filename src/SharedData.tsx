import PeerJS from "peerjs";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { WebRTCDatabase } from "./utils/WebRTCDatabase";
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

interface Join extends BaseAction {
  type: "join";
  player: Player;
}

interface Leave extends BaseAction {
  type: "leave";
  id: string;
}

interface Ready extends BaseAction {
  type: "ready";
  player: Player;
}

interface NotReady extends BaseAction {
  type: "notReady";
  player: Player;
}

type Action = Join | Leave | Ready | NotReady;

// DB Type

export type SharedData = WebRTCDatabase<State, Action>;

// reducer

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "join": {
      return {
        ...state,
        waiting: [...state.waiting, action.player],
      };
    }
    case "leave": {
      return {
        ...state,
        waiting: state.waiting.filter((w) => w.id !== action.id),
      };
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
  join: (player: Player) => void;
  leave: (id: string) => void;
  ready: (player: Player) => void;
  notReady: (player: Player) => void;

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
  const join = useCallback(
    (player: Player) => {
      db.update({ type: "join", player });
    },
    [db]
  );

  const leave = useCallback(
    (id: string) => {
      db.update({ type: "leave", id });
    },
    [db]
  );

  const ready = useCallback(
    (player: Player) => {
      db.update({ type: "ready", player });
    },
    [db]
  );

  const notReady = useCallback(
    (player: Player) => {
      db.update({ type: "notReady", player });
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
      leave(conn.connection.peer);
    };
    db.registerOnDisconnect(handleDisconnect);
    return () => db.removeOnDisconnect(handleDisconnect);
  }, [db, leave]);

  return {
    state,
    join,
    leave,
    ready,
    notReady,
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
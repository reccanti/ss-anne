import PeerJS from "peerjs";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useContext } from "react";

import { WebRTCDatabase } from "../utils/WebRTCDatabase";
import {
  reducer as userReducer,
  Action as UserAction,
  State as UserState,
  initialState as initialUserState,
  creators as userActionCreators,
} from "./users";

// combined state

interface State {
  users: UserState;
}

// combined actions

type Action = UserAction;

// combined action creators

export const creators = {
  users: userActionCreators,
};

// combined reducer

function reducer(state: State, action: Action) {
  return {
    users: { ...userReducer(state.users, action) },
  };
}

// function to create the database

export function initializeSharedData(peer: PeerJS): SharedData {
  const initialState: State = {
    users: initialUserState,
  };
  const db = new WebRTCDatabase(initialState, reducer, peer);
  return db;
}

// DB Type

export type SharedData = WebRTCDatabase<State, Action>;

// Base SharedDataContext

const SharedDataContext = createContext<null | SharedData>(null);

interface SharedDataInterface {
  state: State;
  clone: (id: string) => Promise<void>;
  update: (action: Action) => void;
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

  // wrapper around db.clone
  const clone = useCallback(
    async (id: string) => {
      await db.clone(id);
    },
    [db]
  );

  // wrapper around db.update
  const update = useCallback((action: Action) => db.update(action), [db]);

  /**
   * automatically leave on Disconnect
   *
   * @TODO - Not sure if this makes sense here. Maybe move it into the
   * "initializeSharedDb" function?
   *
   * ~reccanti 7/8/2021
   */
  useEffect(() => {
    const handleDisconnect: Parameters<typeof db.registerOnDisconnect>[0] = (
      conn
    ) => {
      update(creators.users.leaveWaiting(conn.connection.peer));
    };
    db.registerOnDisconnect(handleDisconnect);
    return () => db.removeOnDisconnect(handleDisconnect);
  }, [db, update]);

  return {
    state,
    clone,
    update,
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

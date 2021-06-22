/**
 * @TODO - Here it is, all the fucking state! I can't think
 * of a better way to structure this right now, so I
 * won't. In time, it will probably be better to start
 * breaking this out into separate state managers, for
 * organization as much as performance
 *
 * ~reccanti 6/19/2021
 */
import { createContext, ReactNode, useReducer } from "react";
import { PokeGeneration } from "./utils/pokeGetter";

// various types for interacting with state

interface User {
  name: string;
}

interface BoardConfig {
  name: string;
  columns: number;
  generation: PokeGeneration;
}

// compose all our types into a state blob. Create the reducer
// and action for managing this

interface FuckingState {
  users: {
    player: User | null;
    opponent: User | null;
  };
  board: BoardConfig;
}

const initialState: FuckingState = {
  users: {
    player: null,
    opponent: null,
  },
  board: {
    name: "",
    columns: 15,
    generation: {
      id: 1,
      name: "Generation I",
    },
  },
};

interface BaseAction {
  type: string;
}

interface SetPlayer extends BaseAction {
  type: "setPlayer";
  payload: {
    name: string;
  };
}

interface SetBoardName extends BaseAction {
  type: "setBoardName";
  payload: {
    name: string;
  };
}

interface SetBoardColumns extends BaseAction {
  type: "setBoardColumns";
  payload: {
    columns: number;
  };
}

interface SetBoardGeneration extends BaseAction {
  type: "setBoardGeneration";
  payload: PokeGeneration;
}

type Action = SetPlayer | SetBoardName | SetBoardColumns | SetBoardGeneration;

function reducer(state: FuckingState, action: Action): FuckingState {
  switch (action.type) {
    case "setPlayer": {
      return {
        ...state,
        users: {
          ...state.users,
          player: {
            name: action.payload.name,
          },
        },
      };
    }
    case "setBoardColumns": {
      return {
        ...state,
        board: {
          ...state.board,
          columns: action.payload.columns,
        },
      };
    }
    case "setBoardName": {
      return {
        ...state,
        board: {
          ...state.board,
          name: action.payload.name,
        },
      };
    }
    case "setBoardGeneration": {
      return {
        ...state,
        board: {
          ...state.board,
          generation: {
            ...action.payload,
          },
        },
      };
    }
    default: {
      return state;
    }
  }
}

// combine the state blob with a dispatch function and actions
// to create the context and Provider

interface FuckingContext {
  state: FuckingState;
  dispatch: (action: Action) => void;
}

const initialContext: FuckingContext = {
  state: initialState,
  dispatch() {},
};

export const AllTheFuckingStateCtx =
  createContext<FuckingContext>(initialContext);

interface Props {
  children: ReactNode;
}

export function AllTheFuckingStateProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value: FuckingContext = {
    state,
    dispatch,
  };
  return (
    <AllTheFuckingStateCtx.Provider value={value}>
      {children}
    </AllTheFuckingStateCtx.Provider>
  );
}

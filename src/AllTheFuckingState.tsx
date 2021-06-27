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
import { Pokemon, PokeGeneration, Game, Pokedex } from "./utils/pokeGetter";

// various types for interacting with state

interface User {
  name: string;
}

interface BoardConfig {
  name: string;
  columns: number;
  generation: PokeGeneration;
  game: Game;
  pokemon: Pokemon[];
  pokedex: Pokedex;
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
    game: {
      id: "red",
      name: "Red",
      pokedex: [],
    },
    generation: {
      id: 1,
      name: "Generation I",
    },
    pokedex: {
      id: "kanto",
      name: "Kanto",
      pokemon: [],
    },
    pokemon: [],
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

interface SetBoardPokemon extends BaseAction {
  type: "setBoardPokemon";
  payload: Pokemon[];
}

interface SetBoardGame extends BaseAction {
  type: "setBoardGame";
  payload: Game;
}

interface SetBoardPokedex extends BaseAction {
  type: "setBoardPokedex";
  payload: Pokedex;
}

type Action =
  | SetPlayer
  | SetBoardName
  | SetBoardColumns
  | SetBoardGeneration
  | SetBoardPokemon
  | SetBoardGame
  | SetBoardPokedex;

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
    case "setBoardGame": {
      return {
        ...state,
        board: {
          ...state.board,
          game: {
            ...action.payload,
          },
        },
      };
    }
    case "setBoardPokemon": {
      return {
        ...state,
        board: {
          ...state.board,
          pokemon: [...action.payload],
        },
      };
    }
    case "setBoardPokedex": {
      return {
        ...state,
        board: {
          ...state.board,
          pokedex: {
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

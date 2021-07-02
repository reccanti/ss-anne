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
import PeerJS from "peerjs";

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
  // users: {
  //   player: User | null;
  //   opponent: User | null;
  // };
  user: User | null;
  board: BoardConfig;
  peerjs: PeerJS | null;
}

const initialState: FuckingState = {
  user: null,
  /**
   * @TODO - It might make more sense to make this
   * local state in the BoardSetup page, only updating
   * the full state once we're ready to submit it. This
   * would allow us to more easily make a BoardConfig | null
   * type, since we'd only have to make the board when we have
   * all the information
   *
   * ~reccanti 6/28/2021
   */
  board: {
    name: "",
    columns: 15,
    game: {
      id: "red",
      name: "Red",
      generation: "generation-i",
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
  peerjs: null,
};

interface BaseAction {
  type: string;
}

interface SetUser extends BaseAction {
  type: "setUser";
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

interface SetPeerJS extends BaseAction {
  type: "setPeerJS";
  payload: PeerJS;
}

interface Clear extends BaseAction {
  type: "clear";
}

type Action =
  | SetUser
  | SetBoardName
  | SetBoardColumns
  | SetBoardGeneration
  | SetBoardPokemon
  | SetBoardGame
  | SetBoardPokedex
  | SetPeerJS
  | Clear;

function reducer(state: FuckingState, action: Action): FuckingState {
  switch (action.type) {
    case "setUser": {
      return {
        ...state,
        user: {
          name: action.payload.name,
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
    case "setPeerJS": {
      return {
        ...state,
        peerjs: action.payload,
      };
    }
    case "clear": {
      return initialState;
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

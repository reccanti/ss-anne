/**
 * @TODO - Here it is, all the fucking state! I can't think
 * of a better way to structure this right now, so I
 * won't. In time, it will probably be better to start
 * breaking this out into separate state managers, for
 * organization as much as performance
 *
 * ~reccanti 6/19/2021
 */
import { createContext, ReactNode, useReducer, useContext } from "react";
import { Player } from "./sharedData/users";

// compose all our types into a state blob. Create the reducer
// and action for managing this

interface LocalState {
  user: Player | null;
}

const initialState: LocalState = {
  user: null,
};

interface BaseAction {
  type: string;
}

interface SetUser extends BaseAction {
  type: "setUser";
  user: Player;
}

interface Clear extends BaseAction {
  type: "clear";
}

type Action = SetUser | Clear;

function reducer(state: LocalState, action: Action): LocalState {
  switch (action.type) {
    case "setUser": {
      return {
        ...state,
        user: { ...action.user },
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

interface LocalContext {
  state: LocalState;
  dispatch: (action: Action) => void;
}

const initialContext: LocalContext = {
  state: initialState,
  dispatch() {},
};

export const LocalStateContext = createContext<LocalContext>(initialContext);

export const useLocalState = () => useContext(LocalStateContext);

interface Props {
  children: ReactNode;
}

export function LocalStateProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value: LocalContext = {
    state,
    dispatch,
  };

  return (
    <LocalStateContext.Provider value={value}>
      {children}
    </LocalStateContext.Provider>
  );
}

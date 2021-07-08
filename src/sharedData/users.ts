// internal types

interface Player {
  id: string;
  name: string;
}

// state

export interface State {
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

export type Action = JoinWaiting | LeaveWaiting | JoinPlaying | LeavePlaying;

// action creators

const joinWaiting = (player: Player): JoinWaiting => ({
  type: "joinWaiting",
  player,
});

const leaveWaiting = (id: string): LeaveWaiting => ({
  type: "leaveWaiting",
  id,
});

const joinPlaying = (player: Player): JoinPlaying => ({
  type: "joinPlaying",
  player,
});

const leavePlaying = (id: string): LeavePlaying => ({
  type: "leavePlaying",
  id,
});

export const creators = {
  joinWaiting,
  leaveWaiting,
  joinPlaying,
  leavePlaying,
};

// reducer

export function reducer(state: State, action: Action): State {
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

export const initialState: State = {
  players: [],
  waiting: [],
};

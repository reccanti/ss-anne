import { Pokemon, Pokedex, Game } from "../utils/pokeGetter";

// internal types

interface Ship {
  width: number;
  height: number;
}

// state

export interface State {
  name: string;
  game: Game | null;
  pokedex: Pokedex | null;
  columns: number;
  ships: Ship[];
  tiles: Pokemon[];
}

// initial state

export const initialState: State = {
  name: "",
  columns: 15,
  game: null,
  pokedex: null,
  tiles: [],
  ships: [],
};

// actions

interface BaseAction {
  type: string;
}

interface SetBoardName extends BaseAction {
  type: "setBoardName";
  name: string;
}

interface SetBoardColumns extends BaseAction {
  type: "setBoardColumns";
  columns: number;
}

interface SetBoardGame extends BaseAction {
  type: "setBoardGame";
  game: Game;
}

interface SetBoardPokedex extends BaseAction {
  type: "setBoardPokedex";
  pokedex: Pokedex;
}

interface SetBoardTiles extends BaseAction {
  type: "setBoardTiles";
  tiles: Pokemon[];
}

export type Action =
  | SetBoardName
  | SetBoardColumns
  | SetBoardGame
  | SetBoardPokedex
  | SetBoardTiles;

// action creators

const setBoardName = (name: string): SetBoardName => ({
  type: "setBoardName",
  name,
});

const setBoardColumns = (columns: number): SetBoardColumns => ({
  type: "setBoardColumns",
  columns,
});

const setBoardGame = (game: Game): SetBoardGame => ({
  type: "setBoardGame",
  game,
});

const setBoardPokedex = (pokedex: Pokedex): SetBoardPokedex => ({
  type: "setBoardPokedex",
  pokedex,
});

const setBoardTiles = (tiles: Pokemon[]): SetBoardTiles => ({
  type: "setBoardTiles",
  tiles,
});

export const creators = {
  setBoardName,
  setBoardColumns,
  setBoardGame,
  setBoardPokedex,
  setBoardTiles,
};

// reducer

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setBoardName": {
      return {
        ...state,
        name: action.name,
      };
    }
    case "setBoardColumns": {
      return {
        ...state,
        columns: action.columns,
      };
    }
    case "setBoardGame": {
      return {
        ...state,
        game: action.game,
      };
    }
    case "setBoardPokedex": {
      return {
        ...state,
        pokedex: action.pokedex,
      };
    }
    case "setBoardTiles": {
      return {
        ...state,
        tiles: action.tiles,
      };
    }
    default: {
      return state;
    }
  }
}

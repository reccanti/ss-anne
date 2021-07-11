import {
  Paper,
  TextField,
  TextFieldProps,
  Button,
  makeStyles,
  Grid,
  MenuItem,
  CircularProgress,
} from "@material-ui/core";
import { useState, useEffect, useMemo, FormEvent } from "react";
import { useAllTheFuckingState } from "./AllTheFuckingState";
import { usePokeGetter } from "./PokeGetterContext";
import { Game, Pokedex, Pokemon } from "./utils/pokeGetter";
import { BoardContainer, Board, Cell } from "./Board";
import { useSharedData } from "./sharedData";

// wrapper around the name field. Gives us a better interface

type NameFieldProps = Omit<TextFieldProps, "onChange" | "value"> & {
  value?: string;
  onChange?: (name: string) => void;
};

function NameField({ value, onChange, ...props }: NameFieldProps) {
  const [name, setName] = useState<string>(value ?? "");

  const handleChange: TextFieldProps["onChange"] = (e) => {
    const val = e.target.value;
    setName(val);
  };

  useEffect(() => {
    if (onChange) {
      onChange(name);
    }
  }, [name, onChange]);

  return <TextField {...props} value={name} onChange={handleChange} />;
}

// wrapper around the columns field. Gives us a better interface

type ColumnsFieldProps = Omit<TextFieldProps, "onChange" | "value"> & {
  value?: number;
  onChange?: (columns: number) => void;
};

function ColumnsField({ value, onChange, ...props }: ColumnsFieldProps) {
  const [cols, setCols] = useState<number>(value ?? 15);

  const handleChange: TextFieldProps["onChange"] = (e) => {
    const val = e.target.value;
    const num = Number(val);
    if (isNaN(num)) {
      throw Error("The value given is not a number");
    } else {
      setCols(num);
    }
  };

  useEffect(() => {
    if (onChange) {
      onChange(cols);
    }
  }, [cols, onChange]);

  return (
    <TextField {...props} type="number" value={cols} onChange={handleChange} />
  );
}

// wrapper around the Game Select field. Gives us a better interface

type GameSelectProps = Omit<TextFieldProps, "onChange" | "value"> & {
  getValue: (game: Game) => string; // this needs to return a unique value so it can be used as a lookup
  getDisplayValue?: (game: Game) => string;
  value?: Game | null;
  onChange?: (game: Game | null) => void;
};

function GameSelect({
  getValue,
  getDisplayValue = getValue,
  value = null,
  onChange,
  ...props
}: GameSelectProps) {
  const lookup = useMemo(() => new Map<string, Game>(), []);
  const getter = usePokeGetter();

  // construct the list of games
  const [games, setGames] = useState<Game[]>([]);
  useEffect(() => {
    const listen = async () => {
      const games = await getter.getAllGames();
      setGames(games);
    };
    listen();
  }, [getter]);

  // when the game list changes, update the lookup table
  useEffect(() => {
    lookup.clear();
    games.forEach((game) => {
      lookup.set(getValue(game), game);
    });
  }, [games, lookup, getValue]);

  // handle changes to the given value
  const [game, setGame] = useState<Game | null>(value);
  useEffect(() => {
    if (onChange) {
      onChange(game);
    }
  }, [game, onChange]);

  const handleChange: TextFieldProps["onChange"] = (e) => {
    const lookupValue = e.target.value;
    const value = lookup.get(lookupValue);
    if (!value) {
      throw Error("The given value is not in the lookup table");
    }
    setGame(value);
  };

  const curValue = useMemo(
    () => (game ? getValue(game) : ""),
    [game, getValue]
  );

  // disable the select field until we have items to populate
  // it with
  if (games.length <= 0) {
    return (
      <TextField {...props} value="" select disabled>
        <MenuItem value="">Select a Game...</MenuItem>
      </TextField>
    );
  }

  return (
    <TextField {...props} value={curValue} onChange={handleChange} select>
      {games.map((game) => (
        <MenuItem key={getValue(game)} value={getValue(game)}>
          {getDisplayValue(game)}
        </MenuItem>
      ))}
    </TextField>
  );
}

type PokedexSelectProps = Omit<TextFieldProps, "onChange" | "value"> & {
  forGame: Game | null;
  getValue: (dex: Pokedex) => string; // this needs to return a unique value so it can be used as a lookup
  getDisplayValue?: (dex: Pokedex) => string;
  value?: Pokedex | null;
  onChange?: (dex: Pokedex | null) => void;
};

function PokedexSelect({
  forGame,
  getValue,
  getDisplayValue = getValue,
  value = null,
  onChange,
  ...props
}: PokedexSelectProps) {
  const lookup = useMemo(() => new Map<string, Pokedex>(), []);
  const getter = usePokeGetter();

  // construct the list of pokedexes
  const [dexes, setDexes] = useState<Pokedex[]>([]);
  const [dex, setDex] = useState<Pokedex | null>(value);

  useEffect(() => {
    const listen = async () => {
      setDexes([]);
      setDex(null);
      if (forGame) {
        const dexes = await getter.getPokedexByGame(forGame);
        setDexes(dexes);
      }
    };
    listen();
  }, [getter, forGame]);

  // when the dex list changes, update the lookup table
  useEffect(() => {
    lookup.clear();
    dexes.forEach((dex) => {
      lookup.set(getValue(dex), dex);
    });
  }, [dexes, lookup, getValue]);

  // handle changes to the given value
  useEffect(() => {
    if (onChange) {
      onChange(dex);
    }
  }, [dex, onChange]);

  const handleChange: TextFieldProps["onChange"] = (e) => {
    const lookupValue = e.target.value;
    const value = lookup.get(lookupValue);
    if (!value) {
      throw Error("The given value is not in the lookup table");
    }
    setDex(value);
  };

  const curValue = useMemo(() => (dex ? getValue(dex) : ""), [dex, getValue]);

  // disable the select field until we have items to populate
  // it with
  if (dexes.length <= 0 || forGame === null) {
    return (
      <TextField {...props} value="" select disabled>
        <MenuItem value="">Select a Game...</MenuItem>
      </TextField>
    );
  }

  return (
    <TextField {...props} value={curValue} onChange={handleChange} select>
      {dexes.map((dex) => (
        <MenuItem key={getValue(dex)} value={getValue(dex)}>
          {getDisplayValue(dex)}
        </MenuItem>
      ))}
    </TextField>
  );
}

// wrapper around the Board Preview

interface BoardPreviewProps {
  forPokedex: Pokedex | null;
  columns: number;
}
function BoardPreview({ forPokedex, columns }: BoardPreviewProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const getter = usePokeGetter();

  useEffect(() => {
    const listen = async () => {
      setPokemon([]);
      if (forPokedex) {
        setIsLoading(true);
        const pokemon = await getter.getPokemonByPokedex(forPokedex);
        setPokemon(pokemon);
        setIsLoading(false);
      }
    };
    listen();
  }, [getter, forPokedex]);

  if (isLoading) {
    <CircularProgress />;
  }

  return (
    <BoardContainer>
      <Board
        columns={columns}
        items={pokemon}
        renderCell={(item) => (
          <Cell key={item.name} variant="unknown">
            <img
              // className={styles.image}
              style={{
                pointerEvents: "none",
              }}
              src={item.artworkUrl}
              alt={item.name}
            />
          </Cell>
        )}
      />
    </BoardContainer>
  );
}

/**
 * This is where we'll set up the board for an upcoming game.
 */

const useStyles = makeStyles({
  root: {
    padding: "1rem",
    maxWidth: "350px",
    margin: "1rem",
    "& form > *:not(:first-child)": {
      marginTop: "1rem",
    },
  },
  image: {
    pointerEvents: "none",
  },
});

// container component for managing board state. Makes sure
// PeerJS is initialized and manages state for the Board

interface BoardConfig {
  name: string;
  columns: number;
  game: Game;
  pokedex: Pokedex;
}

interface BoardSetupProps {
  onSubmit?: (config: BoardConfig) => void;
}

export function BoardSetupPage({ onSubmit }: BoardSetupProps) {
  const styles = useStyles();

  const { state: localState } = useAllTheFuckingState();
  const { state: sharedState } = useSharedData();

  const defaultName = localState.user ? `${localState.user.name}'s board` : "";
  const [name, setName] = useState<string>(defaultName);
  const [cols, setCols] = useState<number>(sharedState.board.columns);
  const [game, setGame] = useState<Game | null>(sharedState.board.game);
  const [dex, setDex] = useState<Pokedex | null>(sharedState.board.pokedex);

  const handleNameChange = (name: string) => {
    setName(name);
  };

  const handleColumnChange = (cols: number) => {
    setCols(cols);
  };

  const handleGameChange = (game: Game | null) => {
    setGame(game);
  };

  const handlePokedexChange = (dex: Pokedex | null) => {
    setDex(dex);
  };

  const canSubmit = useMemo(
    () => name && cols && game && dex,
    [name, cols, game, dex]
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name && cols && game && dex && onSubmit) {
      const config: BoardConfig = {
        name,
        columns: cols,
        game,
        pokedex: dex,
      };
      onSubmit(config);
    }
  };

  // fetch state
  return (
    <Grid container>
      <Grid container item xs={2}>
        <Paper className={styles.root}>
          <form onSubmit={handleSubmit}>
            <NameField
              fullWidth
              label="Board Name"
              onChange={handleNameChange}
              value={name}
            />
            <ColumnsField
              fullWidth
              label="Columns"
              value={cols}
              onChange={handleColumnChange}
            />
            <GameSelect
              fullWidth
              label="Game"
              getValue={(game) => game.id}
              getDisplayValue={(game) => game.name}
              value={game}
              onChange={handleGameChange}
            />
            <PokedexSelect
              fullWidth
              label="PokeDex"
              forGame={game}
              getValue={(dex) => dex.id}
              getDisplayValue={(dex) => dex.name}
              value={dex}
              onChange={handlePokedexChange}
            />
            <Button type="submit" fullWidth disabled={!canSubmit}>
              Get Started!
            </Button>
          </form>
        </Paper>
      </Grid>
      <Grid container item xs={10}>
        <BoardPreview columns={cols} forPokedex={dex} />
      </Grid>
    </Grid>
  );
}

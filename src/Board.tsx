/**
 * This contains the presentation components for the Board and the
 * tiles on the board.
 *
 * Tiles can exist in the following states:
 * - not yet guessed
 * - missed
 * - an "unhit" ship
 * - a "hit" ship
 *
 * There should be no game-logic in these components. How you manage that
 * is up to you.
 */
import { ReactNode } from "react";
import { makeStyles } from "@material-ui/core";
import { blueGrey, red, teal } from "@material-ui/core/colors";

type CellVariant = "ship-hit" | "ship-unhit" | "miss" | "unknown";

interface CellStyleProps {
  variant: CellVariant;
}

const useCellStyles = makeStyles({
  root: {
    display: "block",
    padding: "0.5rem",
    background: (props: CellStyleProps) => {
      switch (props.variant) {
        case "ship-unhit": {
          return teal["500"];
        }
        case "ship-hit": {
          return red["500"];
        }
        case "miss": {
          return blueGrey["50"];
        }
        default: {
          return "transparent";
        }
      }
    },
  },
  image: {
    display: "block",
  },
});

interface CellProps {
  variant: CellVariant;
}

export function Cell({ variant }: CellProps) {
  const styles = useCellStyles({ variant });
  return (
    <li className={styles.root}>
      <img
        className={styles.image}
        src="https://via.placeholder.com/75.png"
        alt="uh"
      />
    </li>
  );
}

interface BoardStyleProps {
  columns: number;
}

const useBoardStyles = makeStyles({
  root: {
    display: "grid",
    gridTemplateColumns: (props: BoardStyleProps) =>
      `repeat(${props.columns}, max-content)`,
    gridGap: "0.5rem",
    listStyle: "none",
  },
});

interface BoardProps {
  columns: number;
}

export function Board({ columns }: BoardProps) {
  const styles = useBoardStyles({ columns });
  return (
    <ol className={styles.root}>
      {Array.from({ length: 151 }).map(() => (
        <Cell variant="ship-unhit" />
      ))}
    </ol>
  );
}

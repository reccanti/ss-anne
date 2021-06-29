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
import { ReactNode, SyntheticEvent } from "react";
import { makeStyles } from "@material-ui/core";
import { blueGrey, red, teal } from "@material-ui/core/colors";
import ScrollContainer from "react-indiana-drag-scroll";

export type CellVariant = "ship-hit" | "ship-unhit" | "miss" | "unknown";

interface CellStyleProps {
  variant: CellVariant;
}

const useCellStyles = makeStyles({
  root: {
    display: "block",
    // padding: "0.5rem",
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
  onClick?: (e: SyntheticEvent<HTMLLIElement>) => void;
  children: ReactNode;
}

export function Cell({ variant, onClick, children }: CellProps) {
  const styles = useCellStyles({ variant });
  return (
    <li className={styles.root} onClick={onClick}>
      {children}
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
    // gridGap: "0.5rem",
    listStyle: "none",
    padding: 0,
  },
});

interface BoardProps<DataType> {
  columns: number;
  items: DataType[];
  renderCell: (data: DataType) => ReactNode;
}

export function Board<DataType extends object>({
  columns,
  items,
  renderCell,
}: BoardProps<DataType>) {
  const styles = useBoardStyles({ columns });
  return (
    <ol className={styles.root}>{items.map((item) => renderCell(item))}</ol>
  );
}

const useBoardContainerStyles = makeStyles({
  root: {
    width: "100%",
    height: "100vh",
    overflow: "scroll",
  },
});

interface BoardContainerProps {
  children: ReactNode;
}

export function BoardContainer({ children }: BoardContainerProps) {
  const styles = useBoardContainerStyles();
  return <ScrollContainer className={styles.root}>{children}</ScrollContainer>;
}

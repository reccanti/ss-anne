/**
 * This is the landing page for the application. This is where the
 * user sets their username and launches their instance. I'm modeling
 * it basically on the landing screen for https://skribbl.io/ since
 * I think it does a really good job!
 */

import { ComponentProps } from "react";
import { useHistory } from "react-router";
import { useLocalState } from "./LocalState";
import { usePeerJS } from "./PeerJSContext";
import { CreateUser } from "./CreateUserPage";
import { useSharedData, creators } from "./sharedData";
import { BoardSetupPage } from "./BoardSetupPage";

export function LandingPage() {
  const { state } = useLocalState();
  const peer = usePeerJS();
  const { update } = useSharedData();
  const history = useHistory();

  const handleCreateUserSubmit = ({ name }: { name: string }) => {
    const player = {
      name,
      id: peer.id,
    };
    update(creators.users.joinWaiting(player));
  };

  const handleBoardSetupSubmit: ComponentProps<
    typeof BoardSetupPage
  >["onSubmit"] = ({ name, columns, game, pokedex }) => {
    update(creators.board.setBoardName(name));
    update(creators.board.setBoardColumns(columns));
    update(creators.board.setBoardGame(game));
    update(creators.board.setBoardPokedex(pokedex));
    history.push(`/${peer.id}`);
  };

  if (state.user) {
    return <BoardSetupPage onSubmit={handleBoardSetupSubmit} />;
  }
  return <CreateUser onSubmit={handleCreateUserSubmit} />;
}

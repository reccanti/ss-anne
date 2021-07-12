import { CircularProgress } from "@material-ui/core";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useLocalState } from "./LocalState";
import { CreateUser } from "./CreateUserPage";
import { LobbyPage } from "./LobbyPage";
import { usePeerJS } from "./PeerJSContext";
import { useSharedData, creators } from "./sharedData";

export function GamePage() {
  const [isReady, setIsReady] = useState<boolean>(false);

  const peer = usePeerJS();
  const { clone, update } = useSharedData();
  const { state } = useLocalState();
  const { peer_id } = useParams<{ peer_id: string }>();

  useEffect(() => {
    async function listen() {
      if (peer.id !== peer_id) {
        await clone(peer_id);
      }
      setIsReady(true);
    }
    listen();
    return () => setIsReady(false);
  }, [peer_id, peer.id, clone]);

  const handleSubmit = ({ name }: { name: string }) => {
    const player = {
      name,
      id: peer.id,
    };
    update(creators.users.joinWaiting(player));
  };

  if (!isReady) {
    return <CircularProgress />;
  } else if (!state.user) {
    return <CreateUser onSubmit={handleSubmit} />;
  }
  return <LobbyPage />;
}

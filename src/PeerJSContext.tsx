/**
 * This file is responsible for creating a PeerJS client
 */
import { createContext, useContext, ReactNode } from "react";
import PeerJS from "peerjs";

// This is the base Provider. It assumes you have a PeerJS instance
// already initialized

const PeerJSContext = createContext<null | PeerJS>(null);

export function usePeerJS(): PeerJS {
  const peer = useContext(PeerJSContext);
  if (!peer) {
    throw new Error("usePeerJS must be used within a PeerJSProvider");
  }
  return peer;
}

interface Props {
  children: ReactNode;
  peer: PeerJS;
}

export function PeerJSProvider({ children, peer }: Props) {
  return (
    <PeerJSContext.Provider value={peer}>{children}</PeerJSContext.Provider>
  );
}

// This is an async used to initialize PeerJS

export async function initializePeerJS(): Promise<PeerJS> {
  return new Promise((resolve, reject) => {
    const peer = new PeerJS();
    peer.on("open", () => {
      resolve(peer);
    });
    peer.on("error", (err) => {
      reject(err);
    });
  });
}

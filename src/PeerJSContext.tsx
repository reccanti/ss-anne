/**
 * In this file, we'll handle all the things for connecting
 * and sending data using webrtc
 */
import { ReactNode, useEffect, useState, useMemo } from "react";
import PeerJS from "peerjs";
import { createCtx } from "./utils/createCtx";

type OnOpenCallback = (id: string) => void;
type OnConnectCallback = (dataConnection: PeerJS.DataConnection) => void;
type OnErrorCallback = (err: Error) => void;
type OnDataCallback = (data: any) => void;

type RegisterCallback<T> = (cb: T) => void;

interface PeerJSContext {
  registerOnOpen: RegisterCallback<OnOpenCallback>;
  registerOnConnect: RegisterCallback<OnConnectCallback>;
  registerOnError: RegisterCallback<OnErrorCallback>;
  registerOnData: RegisterCallback<OnDataCallback>;
  messageById: (id: string, data: any) => void;
  messageAll: (data: any) => void;
  connect: (id: string) => void;
  peer: null | PeerJS;
}

const [useCtx, Provider] = createCtx<PeerJSContext>();

export const usePeerJS = useCtx;

interface Props {
  children: ReactNode;
}

export function PeerJSProvider({ children }: Props) {
  const [peer, setPeer] = useState<null | PeerJS>(null);

  // functions for managing connections
  const connections = useMemo(
    () => new Map<string, PeerJS.DataConnection>(),
    []
  );
  const messageById = (id: string, data: any) => {
    const conn = connections.get(id);
    if (conn) {
      conn.send(data);
    }
  };
  const messageAll = (data: any) => {
    const conns = Array.from(connections.values());
    conns.forEach((conn) => {
      conn.send(data);
    });
  };

  const connect = (id: string) => {
    if (!peer) {
      throw Error("PeerJS must be initialized!!!");
    }
    const conn = peer.connect(id);
    conn.on("data", (data: any) => {
      dataCbs.forEach((onData) => {
        onData(data);
      });
    });
  };

  const openCbs = useMemo(() => new Set<OnOpenCallback>(), []);
  const dataCbs = useMemo(() => new Set<OnDataCallback>(), []);
  const errorCbs = useMemo(() => new Set<OnErrorCallback>(), []);
  const connectCbs = useMemo(() => new Set<OnConnectCallback>(), []);

  // functions to add to our callback arrays
  const registerOnOpen = (cb: OnOpenCallback) => openCbs.add(cb);
  const registerOnData = (cb: OnDataCallback) => dataCbs.add(cb);
  const registerOnConnect = (cb: OnConnectCallback) => connectCbs.add(cb);
  const registerOnError = (cb: OnErrorCallback) => errorCbs.add(cb);

  // here we establish a peerjs connection. Our goal here
  // is to "flatten" some of the complexities so we can
  // construct APIs on top of it.
  useEffect(() => {
    const p = new PeerJS();
    p.on("open", (id) => {
      openCbs.forEach((onOpen) => {
        onOpen(id);
      });
    });
    p.on("connection", (dataConnection) => {
      dataConnection.on("data", (data) => {
        dataCbs.forEach((onData) => {
          onData(data);
        });
      });
      dataConnection.on("open", () => {
        connections.set(dataConnection.peer, dataConnection);
        connectCbs.forEach((onConnect) => {
          onConnect(dataConnection);
        });
      });
    });
    p.on("error", (err) => {
      errorCbs.forEach((onError) => {
        onError(err);
      });
    });
    setPeer(p);
  }, [openCbs, connectCbs, errorCbs, dataCbs, connections]);

  const value = {
    peer,
    registerOnOpen,
    registerOnData,
    registerOnConnect,
    registerOnError,
    messageById,
    messageAll,
    connect,
  };

  return <Provider value={value}>{children}</Provider>;
}

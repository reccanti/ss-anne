/**
 * In this file, we'll handle all the things for connecting
 * and sending data using webrtc
 */
import { ReactNode, useEffect, useRef, useState } from "react";
import PeerJS from "peerjs";
import { createCtx } from "./utils/createCtx";

type OnOpenCallback = (id: string) => void;
type OnConnectCallback = (dataConnection: PeerJS.DataConnection) => void;
type OnErrorCallback = (err: Error) => void;
type OnDataCallback = (data: any) => void;

interface WebRTCContext {
  addOnOpen: (cb: OnOpenCallback) => void;
  addOnConnect: (cb: OnConnectCallback) => void;
  addOnError: (cb: OnErrorCallback) => void;
  addOnData: (cb: OnDataCallback) => void;
  connect: (id: string) => void;
  id: null | string;
}

const [useCtx, Provider] = createCtx<WebRTCContext>();

export const useWebRTCCtx = useCtx;

interface Props {
  children: ReactNode;
}
export function WebRTCProvider({ children }: Props) {
  // const [peerConnectionID, setPeerConnectionID] = useState<string>("");
  const peer = useRef<null | PeerJS>(null);

  // it's all our callbacks!
  // const [openCbs, setOpenCbs] = useState<OnOpenCallback[]>([]);
  // const [connectCbs, setConnectCbs] = useState<OnConnectCallback[]>([]);
  // const [errorCbs, setErrorCbs] = useState<OnErrorCallback[]>([]);
  // const [dataCbs, setDataCbs] = useState<OnDataCallback[]>([]);

  const openCbs = new Set<OnOpenCallback>();
  const dataCbs = new Set<OnDataCallback>();
  const errorCbs = new Set<OnErrorCallback>();
  const connectCbs = new Set<OnConnectCallback>();

  // functions to add to our callback arrays
  const addOnOpen = (cb: OnOpenCallback) => openCbs.add(cb);
  const addOnData = (cb: OnDataCallback) => dataCbs.add(cb);
  const addOnConnect = (cb: OnConnectCallback) => connectCbs.add(cb);
  const addOnError = (cb: OnErrorCallback) => errorCbs.add(cb);

  // keep track of the ID
  const [id, setId] = useState<null | string>(null);

  // here we establish a peerjs connection. Our goal here
  // is to "flatten" some of the complexities so we can
  // construct APIs on top of it.
  useEffect(() => {
    const p = new PeerJS();
    p.on("open", (id) => {
      setId(id);
      openCbs.forEach((onOpen) => {
        onOpen(id);
      });
    });
    p.on("connection", (dataConnection) => {
      connectCbs.forEach((onConnect) => {
        onConnect(dataConnection);
      });
      dataConnection.on("data", (data) => {
        dataCbs.forEach((onData) => {
          onData(data);
        });
      });
    });
    p.on("error", (err) => {
      errorCbs.forEach((onError) => {
        onError(err);
      });
    });
    peer.current = p;
  }, []);

  // connect to another peer using PeerJS
  const connect = (id: string) => {
    if (peer.current) {
      peer.current.connect(id);
    }
  };

  // send data to a peerjs connection
  const send = (data: any) => {};

  const value = {
    addOnOpen,
    addOnData,
    addOnConnect,
    addOnError,
    connect,
    id,
  };

  return <Provider value={value}>{children}</Provider>;
}

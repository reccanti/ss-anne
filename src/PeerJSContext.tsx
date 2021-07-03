/**
 * In this file, we'll handle all the things for connecting
 * and sending data using webrtc
 */
import {
  createContext,
  ReactNode,
  useEffect,
  useState,
  useRef,
  useMemo,
  useContext,
} from "react";
import PeerJS from "peerjs";

type OnOpenCallback = (id: string) => void;
type OnConnectCallback = (dataConnection: PeerJS.DataConnection) => void;
type OnErrorCallback = (err: Error) => void;
type OnDataCallback = (data: any) => void;

type RegisterCallback<T> = (cb: T) => void;

interface BaseState {
  status: string;
}

interface Uninitialized extends BaseState {
  status: "uninitialized";
}

interface Ready extends BaseState {
  status: "ready";
  registerOnOpen: RegisterCallback<OnOpenCallback>;
  registerOnConnect: RegisterCallback<OnConnectCallback>;
  registerOnError: RegisterCallback<OnErrorCallback>;
  registerOnData: RegisterCallback<OnDataCallback>;
  messageById: (id: string, data: any) => void;
  messageAll: (data: any) => void;
  connect: (id: string) => void;
  id: string | null;
}

type PeerJSContext = Uninitialized | Ready;

const PeerJSContext = createContext<PeerJSContext>({
  status: "uninitialized",
});

export const usePeerJS = () => useContext(PeerJSContext);

interface Props {
  children: ReactNode;
}

export function PeerJSProvider({ children }: Props) {
  const peer = useRef<PeerJS>();
  const [id, setId] = useState<string | null>(null);

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
    if (!peer.current) {
      throw Error("PeerJS must be initialized!!!");
    }
    const conn = peer.current.connect(id);
    conn.on("data", (data: any) => {
      dataCbs.forEach((onData) => {
        onData(data);
      });
    });
  };

  // memoized sets of all the callbacks that have been registered
  const openCbs = useMemo(() => new Set<OnOpenCallback>(), []);
  const dataCbs = useMemo(() => new Set<OnDataCallback>(), []);
  const errorCbs = useMemo(() => new Set<OnErrorCallback>(), []);
  const connectCbs = useMemo(() => new Set<OnConnectCallback>(), []);

  // functions to add to our callback arrays
  const registerOnOpen = useMemo(
    () => (cb: OnOpenCallback) => openCbs.add(cb),
    [openCbs]
  );
  const registerOnData = useMemo(
    () => (cb: OnDataCallback) => dataCbs.add(cb),
    [dataCbs]
  );
  const registerOnConnect = useMemo(
    () => (cb: OnConnectCallback) => connectCbs.add(cb),
    [connectCbs]
  );
  const registerOnError = useMemo(
    () => (cb: OnErrorCallback) => errorCbs.add(cb),
    [errorCbs]
  );

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
      console.log("new connection");
      dataConnection.on("open", () => {
        if (!connections.has(dataConnection.peer)) {
          connections.set(dataConnection.peer, dataConnection);
          connectCbs.forEach((onConnect) => {
            console.log("connected, bitch");
            onConnect(dataConnection);
          });
        }
      });
    });
    p.on("error", (err) => {
      errorCbs.forEach((onError) => {
        onError(err);
      });
    });
    peer.current = p;
  }, [openCbs, connectCbs, errorCbs, dataCbs, connections]);

  // set the value depending on whether PeerJS has been
  // properly initialized
  let value: PeerJSContext = { status: "uninitialized" };
  if (peer.current && id) {
    value = {
      status: "ready",
      registerOnConnect,
      registerOnData,
      registerOnError,
      registerOnOpen,
      connect,
      messageAll,
      messageById,
      id,
    };
  }

  return (
    <PeerJSContext.Provider value={value}>{children}</PeerJSContext.Provider>
  );
}

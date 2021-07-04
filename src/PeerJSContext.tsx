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
import PeerJS, { DataConnection } from "peerjs";
import { createCtx } from "./utils/createCtx";

type OnOpenCallback = (id: string) => void;
type OnConnectCallback = (dataConnection: PeerJS.DataConnection) => void;
type OnErrorCallback = (err: Error) => void;
type OnDataCallback = (data: any) => void;

type RegisterCallback<T> = (cb: T) => void;

interface BaseState {
  status: string;
}

interface PeerJSContext {
  registerOnOpen: RegisterCallback<OnOpenCallback>;
  registerOnConnect: RegisterCallback<OnConnectCallback>;
  registerOnError: RegisterCallback<OnErrorCallback>;
  registerOnData: RegisterCallback<OnDataCallback>;
  messageById: (id: string, data: any) => void;
  messageAll: (data: any) => void;
  connect: (id: string) => Promise<DataConnection>;
  isConnected: (id: string) => boolean;
  id: string;
}

const [useCtx, BasePeerJSProvider] = createCtx<PeerJSContext>();

export const usePeerJS = useCtx;

interface PeerJSProviderProps {
  children: ReactNode;
  context: PeerJSContext;
}

export function PeerJSProvider({ children, context }: PeerJSProviderProps) {
  return <BasePeerJSProvider value={context}>{children}</BasePeerJSProvider>;
}

/**
 * PeerJS requires some setup before it's ready for use, so this is
 * used to initialize PeerJS in an asynchronous way. Once it's
 * ready, we can use this to pass the context down to the main
 * PeerJS context. This way, we can ensure that PeerJS will always
 * be ready and we won't have to do any weird typechecking
 */
interface Uninitialized extends BaseState {
  status: "uninitialized";
}

interface Ready extends BaseState {
  status: "ready";
  context: PeerJSContext;
}

type PeerJSStatus = Uninitialized | Ready;

const PeerJSStatusContext = createContext<PeerJSStatus>({
  status: "uninitialized",
});

export const usePeerJSStatus = () => useContext(PeerJSStatusContext);

interface PeerJSStatusProviderProps {
  children: ReactNode;
}

export function PeerJSStatusProvider({ children }: PeerJSStatusProviderProps) {
  const peer = useRef<PeerJS>();
  const [id, setId] = useState<string | null>(null);

  // functions for managing connections
  const connections = useMemo(
    () => new Map<string, PeerJS.DataConnection>(),
    []
  );

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

  const messageById = useMemo(
    () => (id: string, data: any) => {
      const conn = connections.get(id);
      if (conn) {
        conn.send(data);
      }
    },
    [connections]
  );
  const messageAll = useMemo(
    () => (data: any) => {
      const conns = Array.from(connections.values());
      conns.forEach((conn) => {
        conn.send(data);
      });
    },
    [connections]
  );

  const isConnected = useMemo(
    () => (id: string) => {
      return connections.has(id);
    },
    [connections]
  );

  const connect = useMemo(
    () => async (id: string) => {
      if (!peer.current) {
        throw Error("PeerJS must be initialized!!!");
      }
      const conn = peer.current.connect(id);
      return new Promise<DataConnection>((resolve, reject) => {
        conn.on("open", () => {
          if (!isConnected(conn.peer)) {
            connections.set(conn.peer, conn);
            conn.on("data", (data: any) => {
              console.log("that's a data...");
              dataCbs.forEach((onData) => {
                onData(data);
              });
            });
            // connectCbs.forEach((onConnect) => {
            //   console.log("connected, bitch");
            //   onConnect(conn);
            // });
            resolve(conn);
          }
        });
        conn.on("error", (err) => {
          reject(err);
        });
      });
    },
    [dataCbs, isConnected, connections]
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
    p.on("connection", (c) => {
      console.log("someone wants to connect to me ❤️");
      if (!isConnected(c.peer)) {
        connections.set(c.peer, c);
        c.on("data", (data: any) => {
          console.log("that's a data...");
          dataCbs.forEach((onData) => {
            onData(data);
          });
        });
        connectCbs.forEach((cb) => {
          cb(c);
        });
      }
    });
    p.on("error", (err) => {
      errorCbs.forEach((onError) => {
        onError(err);
      });
    });
    peer.current = p;
  }, [openCbs, connectCbs, errorCbs, dataCbs, connections, isConnected]);

  // set the value depending on whether PeerJS has been
  // properly initialized
  let value: PeerJSStatus = { status: "uninitialized" };
  if (peer.current && id) {
    value = {
      status: "ready",
      context: {
        registerOnConnect,
        registerOnData,
        registerOnError,
        registerOnOpen,
        connect,
        isConnected,
        messageAll,
        messageById,
        id,
      },
    };
  }

  return (
    <PeerJSStatusContext.Provider value={value}>
      {children}
    </PeerJSStatusContext.Provider>
  );
}

import { useEffect, useContext, useMemo } from "react";
import PeerJS from "peerjs";
import { AllTheFuckingStateCtx } from "./AllTheFuckingState";

type OnOpenCallback = (id: string) => void;
type OnConnectCallback = (dataConnection: PeerJS.DataConnection) => void;
type OnErrorCallback = (err: Error) => void;
type OnDataCallback = (data: any) => void;

type RegisterCallback<T> = (cb: T) => void;

interface PeerJSHook {
  registerOnOpen: RegisterCallback<OnOpenCallback>;
  registerOnData: RegisterCallback<OnDataCallback>;
  registerOnError: RegisterCallback<OnErrorCallback>;
  registerOnConnect: RegisterCallback<OnConnectCallback>;
}

export function usePeerJS(): PeerJSHook {
  const openCbs = useMemo(() => new Set<OnOpenCallback>(), []);
  const dataCbs = useMemo(() => new Set<OnDataCallback>(), []);
  const errorCbs = useMemo(() => new Set<OnErrorCallback>(), []);
  const connectCbs = useMemo(() => new Set<OnConnectCallback>(), []);

  // functions to add to our callback arrays
  const registerOnOpen = (cb: OnOpenCallback) => {
    openCbs.add(cb);
  };
  const registerOnData = (cb: OnDataCallback) => {
    dataCbs.add(cb);
  };
  const registerOnConnect = (cb: OnConnectCallback) => {
    connectCbs.add(cb);
  };
  const registerOnError = (cb: OnErrorCallback) => {
    errorCbs.add(cb);
  };

  const { state, dispatch } = useContext(AllTheFuckingStateCtx);

  /**
   * If a webrtc connection has been defined in the state, return that.
   * Otherwise, create a new instance
   */
  useEffect(() => {
    if (!state.peerjs) {
      const p = new PeerJS();
      p.on("open", (id) => {
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

      dispatch({ type: "setPeerJS", payload: p });
    }
  }, [connectCbs, dataCbs, errorCbs, openCbs, dispatch, state]);

  return {
    registerOnConnect,
    registerOnData,
    registerOnError,
    registerOnOpen,
  };
}

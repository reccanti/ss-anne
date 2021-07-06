/**
 * This is a place to handle all the sequential initialization of
 * our various contexts
 */
import PeerJS from "peerjs";
import { useEffect, useState } from "react";
import { initializePeerJS } from "./PeerJSContext";

// various states

interface BaseStatus {
  status: string;
}

interface UninitializedStatus extends BaseStatus {
  status: "uninitialized";
}

interface ErrorStatus extends BaseStatus {
  status: "error";
  err: Error;
}

interface ReadyStatus<T> extends BaseStatus {
  status: "ready";
  value: T;
}

type Status<T> = UninitializedStatus | ErrorStatus | ReadyStatus<T>;

// PeerJS Initializer

function makeInit<T>(initialize: () => Promise<T>) {
  const [val, setVal] = useState<T | null>(null);
  const [err, setErr] = useState<Error | null>(null);

  useEffect(() => {
    const listen = async () => {
      try {
        const val = await initialize();
        setVal(val);
      } catch (e) {
        setErr(e);
      }
    };
    listen();
  }, []);

  if (val) {
    return {
      status: "ready",
      value: val,
    };
  } else if (err) {
    return {
      status: "error",
      err,
    };
  } else {
    return {
      status: "uninitialized",
    };
  }
}

const usePeerJSInit = makeInit(async () => await initializePeerJS());

// function usePeerJSInit(): Status<PeerJS> {
//   const [peer, setPeer] = useState<PeerJS | null>(null);
//   const [err, setErr] = useState<Error | null>(null);

//   useEffect(() => {
//     const listen = async () => {
//       try {
//         const p = await initializePeerJS();
//         setPeer(p);
//       } catch (e) {
//         setErr(e);
//       }
//     };
//     listen();
//   }, []);

//   if (peer) {
//     return {
//       status: "ready",
//       value: peer,
//     };
//   } else if (err) {
//     return {
//       status: "error",
//       err,
//     };
//   } else {
//     return {
//       status: "uninitialized",
//     };
//   }
// }

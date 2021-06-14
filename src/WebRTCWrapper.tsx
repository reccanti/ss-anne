/**
 * In this file, we'll handle all the things for connecting
 * and sending data using webrtc
 */
import { ReactNode, useEffect, useRef, useState } from "react";
import PeerJS from "peerjs";
import { TextField, Button } from "@material-ui/core";

interface Props {
  children: ReactNode;
  onOpen: (id: string) => void;
  onConnect: (dataConnection: PeerJS.DataConnection) => void;
  onError: (err: Error) => void;
  onData: (data: any) => void;
}

const noop = () => {};

export function WebRTCWrapper({
  children,
  onOpen,
  onConnect,
  onError,
  onData,
}: Props) {
  const [peerConnectionID, setPeerConnectionID] = useState<string>("");
  const peer = useRef<null | PeerJS>(null);

  // here we establish a peerjs connection. Our goal here
  // is to "flatten" some of the complexities so we can
  // construct APIs on top of it.
  useEffect(() => {
    const p = new PeerJS();
    p.on("open", (id) => {
      onOpen(id);
    });
    p.on("connection", (dataConnection) => {
      onConnect(dataConnection);
      dataConnection.on("data", (data) => {
        onData(data);
      });
    });
    p.on("error", (err) => {
      onError(err);
    });
    peer.current = p;
  }, []);

  const handleInputChange = (e: any) => {
    const val = e.target.value;
    setPeerConnectionID(val);
  };

  const connectToPeer = () => {
    if (peer.current) {
      peer.current.connect(peerConnectionID);
    }
  };

  return (
    <>
      <TextField label="PeerJS connection ID" onChange={handleInputChange} />
      <Button onClick={connectToPeer}>Connect to that bad boy</Button>
      {children}
    </>
  );
}

WebRTCWrapper.defaultProps = {
  onConnect: noop,
  onError: noop,
  onData: noop,
  onOpen: noop,
} as Partial<Props>;

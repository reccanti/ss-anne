/**
 * This is a cool WebRTC Database. Basically, if you have
 * a state you want to maintain across multiple clients, you
 * can use this to handle updates
 *
 * @METEORCITY_CANDIDATE
 */
import PeerJS, { DataConnection } from "peerjs";
import base64 from "base-64";

interface Conn {
  // this should be calculated using new Date().getTime()
  lastUpdated: null | number;
  connection: DataConnection;
}

// Diff stuff

interface Diff<Data extends object, Action extends object> {
  id: string; // base64-encoded string identifying this particular diff
  timestamp: number; // when was this update applied
  author: string; // PeerID of the user who made this update
  action: Action; // the action to apply
  prevState: Data; // what was the state when this action was requested
}

function sortDiffLeastToGreatest<
  Data extends object,
  Action extends object,
  D extends Diff<Data, Action> = Diff<Data, Action>
>(a: D, b: D) {
  if (a.timestamp < b.timestamp) {
    return -1;
  } else if (a.timestamp > b.timestamp) {
    return 1;
  } else {
    return 0;
  }
}

// function sortDiffGreatestToLeast<
//   Data extends object,
//   Action extends object,
//   D extends Diff<Data, Action> = Diff<Data, Action>
// >(a: D, b: D) {
//   if (a.timestamp < b.timestamp) {
//     return 1;
//   } else if (a.timestamp > b.timestamp) {
//     return -1;
//   } else {
//     return 0;
//   }
// }

interface BaseDBMessage {
  type: string;
}

interface SendUpdate<Data extends object, Action extends object>
  extends BaseDBMessage {
  type: "sendUpdate";
  updates: Diff<Data, Action>[];
}

interface SendInternals<Data extends object, Action extends object> {
  type: "sendInternals";
  connectionIDs: string[];
  diffStack: Diff<Data, Action>[];
}

interface RequestInternals {
  type: "requestInternals";
}

interface SendConnections {
  type: "sendConnections";
  connections: string[];
}

type Message<Data extends object, Action extends object> =
  | SendUpdate<Data, Action>
  | SendInternals<Data, Action>
  | RequestInternals
  | SendConnections;

type OnConnectCB = (conn: Conn) => void;
type OnDisconnectCB = (conn: Conn) => void;
type OnChangeCB<Data extends object> = (data: Data) => void;

export class WebRTCDatabase<Data extends object, Action extends object> {
  private peer: PeerJS;
  private state: Data = {} as Data;
  private connections: Map<string, Conn> = new Map();
  private diffStack: Diff<Data, Action>[] = [];
  private diffLookup: Set<string> = new Set();
  private reducer: (data: Data, action: Action) => Data;

  private onConnectCallbacks: Set<OnConnectCB> = new Set();
  private onDisconnectCallbacks: Set<OnDisconnectCB> = new Set();
  private onChangeCallbacks: Set<OnChangeCB<Data>> = new Set();

  public get id(): string {
    return this.peer.id;
  }

  constructor(
    initialState: Data,
    reducer: (data: Data, action: Action) => Data,
    peer: PeerJS = new PeerJS()
  ) {
    this.peer = peer;
    this.peer.on("connection", (conn) => {
      this.setupConnection(conn);
    });
    this.reducer = reducer;
    this.setState(initialState);
  }

  /**
   * A function for managing state updates, so we can make sure
   * we're grouping all necessary procedures
   */
  private setState(state: Data) {
    this.state = state;
    this.onChangeCallbacks.forEach((cb) => {
      cb(state);
    });
  }

  /**
   * this is a utility function so that we can share logic for
   * setting up connections
   */
  private async setupConnection(conn: DataConnection): Promise<Conn> {
    return new Promise<Conn>((resolve, reject) => {
      // setup listeners
      conn.on("data", async (data) => {
        await this.setupMessageListener(
          conn.peer,
          data as Message<Data, Action>
        );
      });
      conn.on("error", (err) => {
        reject(err);
      });
      conn.on("close", () => {
        console.log(`See ya ${conn.peer}`);
        const fullConn = this.connections.get(conn.peer) as Conn;
        this.onDisconnectCallbacks.forEach((cb) => {
          cb(fullConn);
        });
        this.connections.delete(conn.peer);
      });

      // add this to our list of connections
      const fullConn = {
        lastUpdated: null,
        connection: conn,
      };
      this.connections.set(conn.peer, fullConn);
      this.onConnectCallbacks.forEach((cb) => {
        cb(fullConn);
      });
      resolve(fullConn);
    });
  }

  private async setupMessageListener(
    id: string,
    message: Message<Data, Action>
  ) {
    switch (message.type) {
      case "sendUpdate": {
        // this should be an array of diffs in chronological order
        const diffs = message.updates;

        // filter out diffs that already exist
        const filtered = diffs.filter((diff) => !this.diffLookup.has(diff.id));

        if (filtered.length > 0) {
          // add these new diffs to the lookup
          filtered.forEach((diff) => {
            this.diffLookup.add(diff.id);
          });

          // apply only the "new" diffs
          this.applyDiffs(filtered);
        }
        break;
      }
      case "requestInternals": {
        if (this.connections.has(id)) {
          const conn = this.connections.get(id) as Conn;
          const connectionIDs = Array.from(this.connections.keys());
          const diffStack = this.diffStack;
          this.message(conn, {
            type: "sendInternals",
            connectionIDs,
            diffStack,
          });
        }
        break;
      }
      case "sendInternals": {
        // connect to all the ids passed
        const connectPromises = message.connectionIDs
          .filter((id) => id !== this.id)
          .map((id) => this.connect(id));
        await Promise.all(connectPromises);

        // update the state
        this.applyDiffs(message.diffStack);
        message.diffStack.forEach((diff) => {
          this.diffLookup.add(diff.id);
        });
        break;
      }
      case "sendConnections": {
        const connPromises = message.connections
          .filter((id) => !this.connections.has(id))
          .map((id) => this.connect(id));
        await Promise.all(connPromises);
      }
    }
  }

  /**
   * Utility function for getting the diffs to apply if
   * there are no diffs in the diff stack. Used as part of
   * `applyDiffs`
   */
  private getDiffsToApplyEmpty(
    diffs: Diff<Data, Action>[]
  ): Diff<Data, Action>[] {
    return diffs.sort(sortDiffLeastToGreatest);
  }

  /**
   * Utility function for getting diffs if there is at least
   * one diff in the diff stack. Used as part of `applyDiffs`
   */
  private getDiffsToApplyMany(
    diffs: Diff<Data, Action>[]
  ): Diff<Data, Action>[] {
    // first sort the diffs we want to apply in order of
    // least-recent-to-most-recent. This way, when we start
    // reconstructing the diffStack, we only have to rewind
    // the state in one big update method, rather than for
    // each diff
    diffs.sort(sortDiffLeastToGreatest);

    // here we construct a list of diffs to apply. We take the head
    // of the sorted diffs and pop off diffs in the stack until we
    // find an entry with a timestamp that's less than the head.
    // Once we have that base list, we can add the rest of our
    // timestamps and sort them from least to greatest
    const [head, ...rest] = diffs;
    const diffsToApply: Diff<Data, Action>[] = [];
    while (
      this.diffStack.length > 0 &&
      this.diffStack[0].timestamp > head.timestamp
    ) {
      const entry = this.diffStack.shift() as Diff<Data, Action>;
      /**
       * @TODO - Maybe find a safer way to do this that doesn't involve
       * mutating state within this function? A better solution may be
       * to create a "getRewoundState" method that finds the state
       * before a given timestamp
       *
       * ~reccanti 7/5/2021
       */
      this.state = entry.prevState;
      diffsToApply.push(entry);
    }
    diffsToApply.push(head);

    const sortedDiffsToApply = diffsToApply
      .concat(...rest)
      .sort(sortDiffLeastToGreatest);

    return sortedDiffsToApply;
  }

  /**
   * In the event that we get a batch of diffs that occurred
   * out-of-order, this function figures out how to reverse
   * the state and apply diffs sequentially
   */
  private applyDiffs(diffs: Diff<Data, Action>[]) {
    // const filtered = diffs.filter((diff) => !this.diffLookup.has(diff.id));

    // get the number of diffs we need to apply to the diff stack
    let diffsToApply: Diff<Data, Action>[] = [];
    if (this.diffStack.length === 0) {
      diffsToApply = this.getDiffsToApplyEmpty(diffs);
    } else {
      diffsToApply = this.getDiffsToApplyMany(diffs);
    }

    // now that we have a list of diffs to apply:
    // 1. cycle through them and apply the action to the reducer
    // 2. add the diff back to the diffStack
    let prevState = this.getState();

    diffsToApply.forEach((diff) => {
      diff.prevState = prevState;
      prevState = this.reducer(prevState, diff.action);
      this.diffStack.unshift(diff);
    });

    this.setState(prevState);
  }

  /**
   * Utility function to get all the diffs since
   * a specific timestamp
   */
  private getAllDiffsSince(timestamp: number): Diff<Data, Action>[] {
    if (this.diffStack.length === 0) {
      return [];
    }
    const diffs: Diff<Data, Action>[] = [];
    let [cur, ...rest] = this.diffStack;
    while (cur.timestamp > timestamp) {
      diffs.push(cur);
      [cur, ...rest] = rest;
    }
    return diffs;
  }

  /**
   * Figure out what diffs need to be applied to all
   * the connections
   */
  private syncConnections() {
    this.connections.forEach((conn) => {
      let diffs: Diff<Data, Action>[] = [];
      if (conn.lastUpdated) {
        diffs = this.getAllDiffsSince(conn.lastUpdated);
      } else {
        diffs = [...this.diffStack].reverse();
      }
      this.message(conn, { type: "sendUpdate", updates: diffs });
    });
  }

  /**
   * Just a utility function to handle messaging connections
   */
  private message(conn: Conn, message: Message<Data, Action>) {
    conn.lastUpdated = new Date().getTime();
    conn.connection.send(message);
  }

  /**
   * Connect to a database with a given Peer ID
   */
  async connect(id: string): Promise<Conn> {
    return new Promise<Conn>((resolve, reject) => {
      const conn = this.peer.connect(id);
      conn.on("open", async () => {
        const fullConn = await this.setupConnection(conn);
        // let all the other connections know that there's a new
        // connection that's been added
        const allConns = Array.from(this.connections.keys());
        this.connections.forEach((conn) => {
          this.message(conn, {
            type: "sendConnections",
            connections: allConns,
          });
        });
        resolve(fullConn);
      });
      conn.on("error", (err) => {
        reject(err);
      });
    });
  }

  /**
   * Given a database with a simlar configuration, this will
   * fetch the state from an external database and copy it to
   * this database
   */
  async clone(id: string) {
    const conn = await this.connect(id);
    this.message(conn, { type: "requestInternals" });
  }

  /**
   * Update the state with an action, store the diff,
   * and update connected databases
   */
  update(action: Action) {
    // construct the necessary fields
    const timestamp = new Date().getTime();
    const author = this.peer.id;
    const prevState = this.getState();
    const id = base64.encode(
      JSON.stringify({
        timestamp,
        author,
        action,
      })
    );

    // construct the diff
    const diff: Diff<Data, Action> = {
      id,
      timestamp,
      author,
      action,
      prevState,
    };

    // add constructed diff to IDs
    this.diffLookup.add(id);

    // apply the diff to the state
    this.applyDiffs([diff]);

    // sync states of other databases
    this.syncConnections();
  }

  /**
   * Get the state of the database
   */
  getState() {
    return this.state;
  }

  /**
   * Functions for managing calbacks
   */
  registerOnConnect(cb: OnConnectCB) {
    this.onConnectCallbacks.add(cb);
  }
  removeOnConnect(cb: OnConnectCB) {
    this.onConnectCallbacks.delete(cb);
  }
  registerOnDisconnect(cb: OnDisconnectCB) {
    this.onDisconnectCallbacks.add(cb);
  }
  removeOnDisconnect(cb: OnDisconnectCB) {
    this.onDisconnectCallbacks.delete(cb);
  }
  registerOnChange(cb: OnChangeCB<Data>) {
    this.onChangeCallbacks.add(cb);
  }
  removeOnChange(cb: OnChangeCB<Data>) {
    this.onChangeCallbacks.delete(cb);
  }
}

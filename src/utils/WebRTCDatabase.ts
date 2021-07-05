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

interface Diff<Data extends object, Action extends Object> {
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

export class WebRTCDatabase<Data extends object, Action extends object> {
  private peer: PeerJS;
  private state: Data = {} as Data;
  private connections: Map<string, Conn> = new Map();
  private diffStack: Diff<Data, Action>[] = [];
  private diffLookup: Set<string> = new Set();
  private reducer: (data: Data, action: Action) => Data;

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
    this.state = initialState;
  }

  // this is a utility function so that we can share logic for
  // setting up connections
  private setupConnection(conn: DataConnection) {
    conn.on("data", (data) => {
      // this should be an array of diffs in chronological order
      const diffs = data as Diff<Data, Action>[];

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
    });

    // add this to our list of connections
    this.connections.set(conn.peer, {
      lastUpdated: null,
      connection: conn,
    });
  }

  private getDiffsToApplyEmpty(
    diffs: Diff<Data, Action>[]
  ): Diff<Data, Action>[] {
    return diffs.sort(sortDiffLeastToGreatest);
  }

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
    const filtered = diffs.filter((diff) => this.diffLookup.has(diff.id));

    let diffsToApply: Diff<Data, Action>[] = [];
    if (this.diffStack.length === 0) {
      diffsToApply = this.getDiffsToApplyEmpty(filtered);
    } else {
      diffsToApply = this.getDiffsToApplyMany(filtered);
    }

    // filter out diffs that already exist
    // const filtered = diffsToApply.filter((diff) =>
    //   this.diffLookup.has(diff.id)
    // );

    // now that we have a list of diffs to apply:
    // 1. cycle through them and apply the action to the reducer
    // 2. add the diff back to the diffStack
    let prevState = this.getState();

    diffsToApply.forEach((diff) => {
      diff.prevState = prevState;
      prevState = this.reducer(prevState, diff.action);
      this.diffStack.unshift(diff);
    });

    this.state = prevState;
  }

  private getAllDiffsSince(timestamp: number): Diff<Data, Action>[] {
    const diffs: Diff<Data, Action>[] = [];
    let [cur, ...rest] = this.diffStack;
    while (cur.timestamp > timestamp) {
      diffs.push(cur);
      [cur, ...rest] = rest;
    }
    return diffs;
  }

  private syncConnections() {
    this.connections.forEach((conn) => {
      let diffs: Diff<Data, Action>[] = [];
      if (conn.lastUpdated) {
        diffs = this.getAllDiffsSince(conn.lastUpdated);
      } else {
        diffs = [...this.diffStack].reverse();
      }
      conn.lastUpdated = new Date().getTime();
      conn.connection.send(diffs);
    });
  }

  async connect(id: string) {
    return new Promise<void>((resolve, reject) => {
      const conn = this.peer.connect(id);
      conn.on("open", () => {
        this.setupConnection(conn);
        resolve();
      });
      conn.on("error", (err) => {
        reject(err);
      });
    });
  }

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

  getState() {
    return this.state;
  }
}

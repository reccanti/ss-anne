/**
 * This is where the game logic is handled, there are two phases:
 *
 * 1. Setup - Allow the user to place their "ships"
 * 2. Play - The users guess where the others ships are
 *
 * To be honest, I'm not sure if these should be in the same file,
 * but I'm not sure what the best way to break this up is yet
 */

import { createCtx } from "./utils/createCtx";

// interface WebRTCContext {
//   addOnOpen: (cb: OnOpenCallback) => void;
//   addOnConnect: (cb: OnConnectCallback) => void;
//   addOnError: (cb: OnErrorCallback) => void;
//   addOnData: (cb: OnDataCallback) => void;
//   connect: (id: string) => void;
//   send: (data: any) => void;
//   id: null | string;
// }

interface GameLogicContext {
  /**
   * This will be passed to the GameLogicContext once the board has been set up.
   * It should control things like the Pokemon order and the number of columns
   */
  // boardConfig: BoardConfig;
}

const [useCtx, Provider] = createCtx<GameLogicContext>();

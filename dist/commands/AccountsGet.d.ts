/**
 * @file AccountsGet.ts
 * @module evm-lite-cli
 * @author Danu Kumanan <https://github.com/danu3006>
 * @author Mosaic Networks <https://github.com/mosaicnetworks>
 * @date 2018
 */
import * as Vorpal from 'vorpal';
import { StagingFunction } from '../classes/Staging';
import Session from '../classes/Session';
/**
 * Should return either a Staged error or success.
 *
 * @remarks
 * This staging function will parse all the arguments of the `accounts get`
 * command and resolve a success or an error.
 *
 * @param args - Arguments to the command. @link
 * @param session - Controls the session of the CLI instance.
 * @returns An object specifying a success or an error.
 *
 * @alpha
 */
export declare const stage: StagingFunction;
/**
 * Should construct a Vorpal.Command instance for the command `accounts get`.
 *
 * @remarks
 * Allows you to get account details such as balance and nonce from the
 * blockchain.
 *
 * Usage: `accounts get --formatted 0x583560ee73713a6554c463bd02349841cd79f6e2`
 *
 * The above command will get the account balance and nonce from the node and
 * format the returned JSON into an ASCII table.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts get`.
 *
 * @alpha
 */
export default function commandAccountsGet(evmlc: Vorpal, session: Session): Vorpal.Command;

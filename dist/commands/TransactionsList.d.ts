/**
 * @file TransactionList.ts
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
 * This staging function will parse all the arguments of the `transactions get` command
 * and resolve a success or an error.
 *
 * @param args - Arguments to the command.
 * @param session - Controls the session of the CLI instance.
 * @returns An object specifying a success or an error.
 *
 * @alpha
 */
export declare const stage: StagingFunction;
/**
 * Should construct a Vorpal.Command instance for the command `transactions list`.
 *
 * @remarks
 * Allows you list all the transactions sent using the CLI and each of its details..
 *
 * Usage: `transactions list --formatted --verbose`
 *
 * Here we have executed a command to list all the transactions sent with the CLI and
 * asked for the `verbose` output of the data which then should be formatted into an
 * ASCII table specified by `formatted`.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts create`.
 *
 * @alpha
 */
export default function commandTransactionsList(evmlc: Vorpal, session: Session): Vorpal.Command;

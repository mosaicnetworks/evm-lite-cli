/**
 * @file TransactionGet.ts
 * @module evm-lite-cli <https://github.com/mosaicnetworks/evm-lite-cli>
 * @author Mosaic Networks <https://github.com/mosaicnetworks>
 * @author Danu Kumanan <https://github.com/danu3006>
 * @date 2018
 */
import * as Vorpal from "vorpal";
import { StagingFunction } from "../classes/Staging";
import Session from "../classes/Session";
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
 * Should construct a Vorpal.Command instance for the command `transactions get`.
 *
 * @remarks
 * Allows you to get transaction details such as `gas`, `gasprice`, `status`, `to` etc. using a
 * transaction hash.
 *
 * Usage: `transactions get --formatted 0xf4d71b947c7d870332b849b489a8f4dcdca166f9c485963b473724eab9eaee62`
 *
 * Here we have requested the details of the transaction with hash the specified hash and asked that the
 * data is formatted into an ASCII table.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts create`.
 *
 * @alpha
 */
export default function commandTransactionsGet(evmlc: Vorpal, session: Session): Vorpal.Command;

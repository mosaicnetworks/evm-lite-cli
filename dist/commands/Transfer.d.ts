/**
 * @file Transfer.ts
 * @module evm-lite-lit <https://github.com/mosaicnetworks/evm-lite-lib>
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
 * This staging function will parse all the arguments of the `transfer` command
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
 * Should construct a Vorpal.Command instance for the command `transfer`.
 *
 * @remarks
 * Allows you to transfer token(s) from one account to another.
 *
 * Usage: `transfer
 * --from 0x583560ee73713a6554c463bd02349841cd79f6e2
 * --to 0x546756ee73713a6554c463bd02349841cd79f6e2
 * --value 200
 * --pwd ~/pwd.txt
 * --gas 1000000
 * --gasprice 0`
 *
 * Here we have requested the transfer of `200` tokens to the specified address from
 * `0x583560ee73713a6554c463bd02349841cd79f6e2`. The default `gas` and `gasprice` can be set in the configuration file
 * to be used for all transfers.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts create`.
 *
 * @alpha
 */
export default function commandTransfer(evmlc: Vorpal, session: Session): Vorpal.Command;

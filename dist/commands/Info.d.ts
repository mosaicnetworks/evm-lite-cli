/**
 * @file Info.ts
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
 * This staging function will parse all the arguments of the `info` command
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
 * Should construct a Vorpal.Command instance for the command `info`.
 *
 * @remarks
 * Prints information about the node in JSON or formatted into an ASCII table.
 *
 * Usage: `info --formatted`
 *
 * Here we have executed a command to view information about the node in an ASCII table.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts get`.
 *
 * @alpha
 */
export default function commandInfo(evmlc: Vorpal, session: Session): Vorpal.Command;

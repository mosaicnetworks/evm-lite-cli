/**
 * @file AccountsCreate.ts
 * @author Mosaic Networks <https://github.com/mosaicnetworks>
 * @date 2018
 */
import * as Vorpal from "vorpal";
import { StagingFunction } from "../classes/Staging";
import Session from "../classes/Session";
/**
 * Should return either a Staged error or success.
 *
 * @remarks
 * This staging function will parse all the arguments of the `config set` command
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
 * Should construct a Vorpal.Command instance for the command `config set`.
 *
 * @remarks
 * Allows you to set EVM-Lite CLI configuration settings through the CLI. Can be done interactively.
 *
 * Usage: `config set --host 5.5.5.1`
 *
 * Here we have executed a command to change the default host to connect to for any command
 * through the CLI to `5.5.5.1`.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts get`.
 *
 * @alpha
 */
export default function commandConfigSet(evmlc: Vorpal, session: Session): Vorpal.Command;

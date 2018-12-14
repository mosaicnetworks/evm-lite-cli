/**
 * @file AccountsList.ts
 * @module evm-lite-cli
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
 * This staging function will parse all the arguments of the `accounts list` command
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
 * Should construct a Vorpal.Command instance for the command `accounts list`.
 *
 * @remarks
 * Allows you to list all the accounts either locally or remote. If account details such
 * as balance and nonce are required then the `--verbose, -v` flag should be provided.
 * Local accounts are read from the `keystore` provided in the configuration file.
 *
 * Usage: `accounts list --verbose --formatted`
 *
 * Here we have asked to display the formatted version of all the accounts along with
 * their balance and nonce which is specified by the `verbose` flag. All accounts are
 * sourced from the local keystore.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts get`.
 *
 * @alpha
 */
export default function commandAccountsList(evmlc: Vorpal, session: Session): Vorpal.Command;

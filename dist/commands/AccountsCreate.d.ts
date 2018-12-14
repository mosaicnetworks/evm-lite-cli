/**
 * @file AccountsCreate.ts
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
 * This staging function will parse all the arguments of the `accounts create` command
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
 * Should construct a Vorpal.Command instance for the command `accounts create`.
 *
 * @remarks
 * Allows you to create and encrypt accounts locally. Created accounts will either be placed
 * in the keystore folder provided by default config file (located at `~/.evmlc/config.toml`)
 * or the config file located in the `--datadir, -d` flag.
 *
 * Usage: `accounts create --verbose --output ~/datadir/keystore --pwd ~/datadir/pwd.txt`
 *
 * Here we have specified to create the account file in `~/datadir/keystore`, encrypt
 * with the `~/datadir/pwd.txt` and once that is done, provide the verbose output of
 * the created account.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts create`.
 *
 * @alpha
 */
export default function commandAccountsCreate(evmlc: Vorpal, session: Session): Vorpal.Command;

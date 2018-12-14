/**
 * @file AccountsCreate.ts
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
 * This staging function will parse all the arguments of the `accounts update` command
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
 * Should construct a Vorpal.Command instance for the command `accounts update`.
 *
 * @remarks
 * Allows you to update the password of a `V3JSONKeystore` file if the the previous password
 * is known.
 *
 * Usage: `accounts update 0x583560ee73713a6554c463bd02349841cd79f6e2 --old ~/oldpwd.txt --new ~/newpwd.txt`
 *
 * Here we have written a command to change the password from the contents `oldpwd.txt` to the contents
 * of `newpwd.txt` for the account `0x583560ee73713a6554c463bd02349841cd79f6e2`.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts get`.
 *
 * @alpha
 */
export default function commandAccountsUpdate(evmlc: Vorpal, session: Session): Vorpal.Command;

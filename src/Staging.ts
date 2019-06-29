// Goal
// This framework needs to be used to return a intermidiary object or value
// that can be parsed by an output engine. Needs to account for any errors that
// might be thrown or sent from the `staging` command.

// The errors that need to be accounted for:
// - Any blank fields
// - Account decryption fails
// - Direcrtory or file does not exist
// - Promise fails or an invalid connections
// - Path does not exist.

// Only three possible senarios occur with commands. A commnand can have both
// formatted output or verbose output or both. A function with a format flag
// will only have two output types `ASCIITable` or an `object`. Notice with
// the verbose flag these types dont change. A function with a verbose flag
// will only have `object` or a `string`.

// Requires two different output types

import ASCIITable from 'ascii-table';

import { Args as VorpalArgs } from 'vorpal';

import Globals from './Globals';
import Session from './Session';

export interface GenericOptions {
	debug?: boolean;
}

// The output type of the staging command
export interface StagedOutput<
	Arguments extends VorpalArgs<GenericOptions>,
	FormattedType,
	NormalType
> {
	args: Arguments;

	// The generic output for all three types of commands
	display?: FormattedType | NormalType;
}

// Staging function signature
export type StagingFunction<
	Arguments extends VorpalArgs<GenericOptions>,
	FormattedType,
	NormalType
> = (
	args: Arguments,
	session: Session
) => Promise<StagedOutput<Arguments, FormattedType, NormalType>>;

export default class Staging<
	Arguments extends VorpalArgs<GenericOptions>,
	T1,
	T2
> {
	constructor(
		public readonly debugMode: boolean,
		public readonly args: Arguments
	) {}

	public success(message: T1 | T2): StagedOutput<Arguments, T1, T2> {
		return {
			args: this.args,
			display: message
		};
	}

	public debug(message: string): void {
		if (this.args.options.debug || this.debugMode || false) {
			Globals.warning(`[DEBUG] ${message}`);
		}
	}
}

// Parse output to display
export const execute = <Arguments extends VorpalArgs<GenericOptions>, T1, T2>(
	fn: StagingFunction<Arguments, T1, T2>,
	args: Arguments,
	session: Session
): Promise<void> => {
	return new Promise<void>(async resolve => {
		try {
			const output = await fn(args, session);

			let message: string = '';

			if (output.display !== undefined) {
				switch (typeof output.display) {
					case 'boolean':
						message = output.display ? 'Yes' : 'No';
						break;
					case 'string':
						message = output.display;
						break;
					case 'object':
						if (output.display instanceof ASCIITable) {
							message = output.display.toString();
						} else {
							message = JSON.stringify(output.display);
						}
						break;
				}
			}

			Globals[output.display !== undefined ? 'success' : 'error'](
				`${message.charAt(0).toUpperCase() + message.slice(1)}`
			);
		} catch (e) {
			Globals.error(`${e.toString() || 'ERROR_NOT_SPECIFIED'}`);
		}

		resolve();
	});
};

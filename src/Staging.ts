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

export interface IOptions {
	debug?: boolean;
}

// The output type of the staging command
export interface IStagedOutput<
	TArguments extends VorpalArgs<IOptions>,
	TFormatted,
	TNormal
> {
	args: TArguments;

	// The generic output for all three types of commands
	display?: TFormatted | TNormal;

	// The generic error format
	error?: {
		type: string;
		message: string;
	};
}

// Staging function signature
export type IStagingFunction<
	TArguments extends VorpalArgs<IOptions>,
	TFormatted,
	TNormal
> = (
	args: TArguments,
	session: Session
) => Promise<IStagedOutput<TArguments, TFormatted, TNormal>>;

export default class Staging<
	TArguments extends VorpalArgs<IOptions>,
	TFormatted,
	TNormal
> {
	constructor(
		public readonly debugMode: boolean,
		public readonly args: TArguments
	) {}

	public error(
		type: string,
		message: string
	): IStagedOutput<TArguments, TFormatted, TNormal> {
		return {
			args: this.args,
			error: {
				type,
				message
			}
		};
	}

	public success(
		message: TFormatted | TNormal
	): IStagedOutput<TArguments, TFormatted, TNormal> {
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
export const execute = <
	TArguments extends VorpalArgs<IOptions>,
	TFormatted,
	TNormal
>(
	fn: IStagingFunction<TArguments, TFormatted, TNormal>,
	args: TArguments,
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
			let error: string = 'Critical Error: No stack trace availiable';

			if (e && e.error) {
				if (e.error.type && e.error.message) {
					const type = e.error.type as string;

					if (type.startsWith('@error')) {
						error = e.error.message;
					}
				} else {
					error = e.toString();
				}
			}

			Globals.error(error);
		}

		resolve();
	});
};

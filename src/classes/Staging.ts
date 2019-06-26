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

// The output type of the staging command
export interface StagedOutput<FormattedType, NormalType> {
	args: VorpalArgs;

	// The generic output for all three types of commands
	display?: FormattedType | NormalType;

	// Errors returned from staging functions are always of type string
	error?: {
		type: string;
		message?: string;
	};
}

// Staging function signature
export type StagingFunction<FormattedType, NormalType> = (
	args: VorpalArgs,
	session: Session
) => Promise<StagedOutput<FormattedType, NormalType>>;

export default class Staging<T1, T2> {
	public static ERRORS = {
		BLANK_FIELD: 'Field(s) should not be blank',
		DIRECTORY_NOT_EXIST: 'Directory should exist',
		FAILED_DECRYPTION: 'Failed decryption',
		FETCH_FAILED: 'Could not fetch data',
		FILE_NOT_FOUND: 'Cannot find file',
		INVALID_CONNECTION: 'Invalid connection',
		IS_DIRECTORY: 'Should not be a directory',
		IS_FILE: 'Should be a directory',
		OTHER: 'Something went wrong',
		PATH_NOT_EXIST: 'Path(s) should exist'
	};

	constructor(public readonly args: VorpalArgs) {}

	public success(message: T1 | T2): StagedOutput<T1, T2> {
		return {
			args: this.args,
			display: message
		};
	}

	public error(type: string, message?: string): StagedOutput<T1, T2> {
		return {
			args: this.args,
			error: {
				message,
				type
			}
		};
	}
}

// Parse output to display
export const execute = <T1, T2>(
	fn: StagingFunction<T1, T2>,
	args: VorpalArgs,
	session: Session
): Promise<void> => {
	return new Promise<void>(async resolve => {
		const output: StagedOutput<T1, T2> = await fn(args, session);
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
						// @ts-ignore
						message = output.display.toString();
					} else {
						message = JSON.stringify(output.display);
					}
					break;
			}
		}

		if (output.error) {
			message = `${output.error.type}: ${output.error.message ||
				'ERROR'}`;
		}

		Globals[output.display !== undefined ? 'success' : 'error'](
			`${message.charAt(0).toUpperCase() + message.slice(1)}`
		);

		resolve();
	});
};

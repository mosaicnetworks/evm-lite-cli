import { Args as VorpalArgs } from 'vorpal';

import Globals from '../Globals';
import Session from '../Session';

import genericFrames, { IGenericFrames } from './generics';
import keystoreFrames, { IKeystoreFrames } from './keystore';
import POAFrames, { IPOAFrames } from './poa';
import txFrames, { ITransactionFrames } from './transaction';

// default options for all commands
export interface IOptions {
	debug?: boolean;
}

// error type
interface IError {
	type: string;
	message: string;
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
	error?: IError;
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

class Frames<TArguments extends VorpalArgs<IOptions>, TFormatted, TNormal> {
	constructor(
		public readonly session: Session,
		public readonly args: TArguments
	) {}

	private error(
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

	private success(
		message: TFormatted | TNormal
	): IStagedOutput<TArguments, TFormatted, TNormal> {
		return {
			args: this.args,
			display: message
		};
	}

	private debug(message: string): void {
		if (this.args.options.debug || this.session.debug) {
			Globals.warning(`[DEBUG] ${message}`);
		}
	}

	public staging() {
		return {
			success: this.success.bind(this),
			error: this.error.bind(this),
			debug: this.debug.bind(this)
		};
	}

	public generics(): IGenericFrames {
		return genericFrames(this);
	}

	public keystore(): IKeystoreFrames {
		return keystoreFrames(this);
	}

	public POA(): IPOAFrames {
		return POAFrames(this);
	}

	public transaction(): ITransactionFrames {
		return txFrames(this);
	}
}

export default Frames;

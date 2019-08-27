import { Args as VorpalArgs } from 'vorpal';

import { IAbstractConsensus } from 'evm-lite-consensus';

import Globals from '../Globals';
import Session from '../Session';

import genericHooks, { IGenericHooks } from './hooks/generics';
import keystoreHooks, { IKeystoreHooks } from './hooks/keystore';
import poaHooks, { IPOAHooks } from './hooks/poa';
import txHooks, { ITxHooks } from './hooks/transaction';

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
	TNormal = TFormatted
> {
	args: TArguments;

	// The generic output for all three types of commands
	display?: TFormatted | TNormal;

	// The generic error format
	error?: IError;
}

// Staging function signature
export type IStagingFunction<
	TConsensus extends IAbstractConsensus,
	TArguments extends VorpalArgs<IOptions>,
	TFormatted,
	TNormal
> = (
	args: TArguments,
	session: Session<TConsensus>
) => Promise<IStagedOutput<TArguments, TFormatted, TNormal>>;

class Staging<
	TArguments extends VorpalArgs<IOptions>,
	TFormatted,
	TNormal = TFormatted
> {
	constructor(public readonly args: TArguments) {}

	public handlers(debug: boolean) {
		return {
			success: this.success.bind(this),
			error: this.error.bind(this),
			debug: this.debug.bind(this, debug)
		};
	}

	public genericHooks(session: Session<any>): IGenericHooks {
		return genericHooks(this, session);
	}

	public keystoreHooks(session: Session<any>): IKeystoreHooks {
		return keystoreHooks(this, session);
	}

	public poaHooks(session: Session<any>): IPOAHooks {
		return poaHooks(this, session);
	}

	public txHooks(session: Session<any>): ITxHooks {
		return txHooks(this, session);
	}

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

	private debug(debug: boolean, message: string): void {
		if (this.args.options.debug || debug) {
			Globals.warning(`[DEBUG] ${message}`);
		}
	}
}

export default Staging;

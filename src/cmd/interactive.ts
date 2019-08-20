import Vorpal, { Args, Command } from 'vorpal';

import Solo from 'evm-lite-solo';

import Session from '../Session';
import Staging, { execute, IOptions, IStagingFunction } from '../staging';

interface Options extends IOptions {}

export interface Arguments extends Args<Options> {}

export default function command(
	evmlc: Vorpal,
	session: Session<Solo>
): Command {
	const description = 'Enter interactive mode';

	return evmlc
		.command('interactive')
		.alias('i')
		.description(description)
		.types({
			string: []
		})
		.action((args: Arguments) => execute(stage, args, session));
}

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, void>(args);

	// prepare
	const { success } = staging.handlers(session.debug);

	return Promise.resolve(success());
};

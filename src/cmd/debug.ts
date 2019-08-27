import Vorpal, { Args, Command } from 'vorpal';

import { Solo } from 'evm-lite-consensus';

import Session from '../Session';
import Staging, { execute, IOptions } from '../staging';

interface Options extends IOptions {}

export interface Arguments extends Args<Options> {}

export default (evmlc: Vorpal, session: Session<Solo>): Command => {
	const description = 'Toggle debug mode';

	return evmlc
		.command('debug')
		.alias('d')
		.description(description)
		.types({
			string: []
		})
		.action((args: Arguments) => execute(stage, args, session));
};

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, string>(args);

	// prepare
	const { success } = staging.handlers(session.debug);

	// command execution
	session.debug = !session.debug;

	return Promise.resolve(
		success(`Debug: ${session.debug ? 'Enabled' : 'Disabled'}`)
	);
};

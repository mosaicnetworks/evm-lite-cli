import Vorpal, { Args, Command } from 'vorpal';

import { Solo } from 'evm-lite-consensus';

import Session from '../Session';
import Staging, { execute, IOptions } from '../staging';

interface Options extends IOptions {
	value: any;
}

export interface Arguments extends Args<Options> {}

export default (evmlc: Vorpal, session: Session<Solo>): Command => {
	const d = 'Test command';

	return evmlc
		.command('test')
		.hidden()
		.description(d)
		.option('--value <value>', 'test valye')
		.action((args: Arguments) => execute(stage, args, session));
};

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, string>(args);

	const { success, error } = staging.handlers(session.debug);

	const test = false;

	if (test) {
		return Promise.reject(error('@error/asd', 'asd'));
	}

	return success('hello');
};

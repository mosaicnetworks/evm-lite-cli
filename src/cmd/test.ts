import Vorpal, { Args, Command } from 'vorpal';

import Solo from 'evm-lite-solo';

import Session from '../Session';
import Staging, { execute, IOptions } from '../staging';

interface Options extends IOptions {
	value: any;
}

export interface Arguments extends Args<Options> {}

export default function command(
	evmlc: Vorpal,
	session: Session<Solo>
): Command {
	const description = 'Test command';

	return evmlc
		.command('test')
		.hidden()
		.description(description)
		.option('--value <value>', 'test valye')
		.types({
			string: []
		})
		.action((args: Arguments) => execute(stage, args, session));
}

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, string>(args);

	const { success } = staging.handlers(session.debug);

	return Promise.resolve(success(`test`));
};

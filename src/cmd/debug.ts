import Vorpal, { Command, Args } from 'vorpal';

import Session from '../Session';
import Staging, { execute, IStagingFunction, IOptions } from '../Staging';

interface Options extends IOptions {}

export interface Arguments extends Args<Options> {
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Toggle debug mode';

	return evmlc
		.command('debug')
		.alias('d')
		.description(description)
		.types({
			string: []
		})
		.action((args: Arguments) => execute(stage, args, session));
}

export const stage: IStagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const staging = new Staging<Arguments, string, string>(session.debug, args);

	session.debug = !session.debug;

	return Promise.resolve(
		staging.success(`Debug: ${session.debug ? 'Enabled' : 'Disabled'}`)
	);
};

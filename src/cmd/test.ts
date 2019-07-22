import Vorpal, { Command, Args } from 'vorpal';

import Session from '../Session';
import Staging, { execute, IStagingFunction, IOptions } from '../Staging';

interface Options extends IOptions {
	value: any;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Creates an encrypted keypair locally';

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

export const stage: IStagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const staging = new Staging<Arguments, string, string>(session.debug, args);

	return Promise.resolve(
		staging.success(`${args.options.value} - ` + typeof args.options.value)
	);
};

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
	const description = 'Output current configuration file';

	return evmlc
		.command('config view')
		.alias('c v')
		.option('-d, --debug', 'show debug output')
		.description(description)
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

export const stage: IStagingFunction<Solo, Arguments, string, string> = async (
	args: Arguments,
	session: Session<Solo>
) => {
	const staging = new Staging<Arguments, string, string>(args);

	// prepare
	const { debug, success } = staging.handlers(session.debug);

	// command execution
	debug(`Reading config file: ${session.datadir.configPath}`);

	return Promise.resolve(success(session.datadir.configToml));
};

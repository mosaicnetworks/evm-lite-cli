import Vorpal, { Command, Args } from 'vorpal';

import Session from '../Session';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

const pkg = require('../../package.json');

interface Options extends GenericOptions {
	value: any;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Display current version of cli';

	return evmlc
		.command('version')
		.alias('v')
		.option('-d, --debug', 'show debug output')
		.description(description)
		.types({
			string: []
		})
		.action((args: Arguments) => execute(stage, args, session));
}

export const stage: StagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const staging = new Staging<Arguments, string, string>(session.debug, args);

	staging.debug(`evm-lite-core: ${pkg.dependencies[`evm-lite-core`]}`);
	staging.debug(
		`evm-lite-keystore: ${pkg.dependencies[`evm-lite-keystore`]}`
	);
	staging.debug(`evm-lite-datadir: ${pkg.dependencies[`evm-lite-datadir`]}`);

	return Promise.resolve(staging.success(`${pkg.version}`));
};

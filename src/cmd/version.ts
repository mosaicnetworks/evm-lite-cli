import Vorpal, { Args, Command } from 'vorpal';

import Solo from 'evm-lite-solo';

import Session from '../Session';
import Staging, { execute, IOptions } from '../staging';

const pkg = require('../../package.json');

interface Options extends IOptions {
	value: any;
}

export interface Arguments extends Args<Options> {}

export default function command(
	evmlc: Vorpal,
	session: Session<Solo>
): Command {
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

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, string>(args);

	const { debug, success } = staging.handlers(session.debug);

	debug(`evm-lite-core: ${pkg.dependencies[`evm-lite-core`]}`);
	debug(`evm-lite-keystore: ${pkg.dependencies[`evm-lite-keystore`]}`);
	debug(`evm-lite-datadir: ${pkg.dependencies[`evm-lite-datadir`]}`);

	return Promise.resolve(success(`evm-lite-cli ${pkg.version}`));
};

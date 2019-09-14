import Vorpal from 'vorpal';

import color from '../core/color';
import Session from '../core/Session';

import Command, { IArgs } from '../core/Command';

const pkg = require('../../package.json');

export default (evmlc: Vorpal, session: Session): Command => {
	const description = 'Display current version of cli';

	return evmlc
		.command('version')
		.alias('v')
		.option('-d, --debug', 'show debug output')
		.description(description)
		.types({
			string: []
		})
		.action((args: IArgs<{}>) => new VersionCommand(session, args).run());
};

class VersionCommand extends Command {
	protected async init(): Promise<boolean> {
		return false;
	}

	protected async interactive(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<void> {
		color.green(`evm-lite-core: ${pkg.dependencies[`evm-lite-core`]}`);
		color.green(
			`evm-lite-keystore: ${pkg.dependencies[`evm-lite-keystore`]}`
		);
		color.green(
			`evm-lite-datadir: ${pkg.dependencies[`evm-lite-datadir`]}`
		);

		color.green(`evm-lite-cli: ${pkg.version}`);
	}
}

export const Version = VersionCommand;

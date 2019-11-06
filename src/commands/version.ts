import Vorpal from 'vorpal';

import Session from '../core/Session';

import Command, { Arguments, Options } from '../core/Command';

const pkg = require('../../package.json');

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Display current version of cli';

	return evmlc
		.command('version')
		.alias('v')
		.description(description)
		.types({
			string: []
		})
		.action((args: Arguments<Options>) =>
			new VersionCommand(session, args).run()
		);
};

class VersionCommand extends Command {
	protected async init(): Promise<boolean> {
		return false;
	}

	protected async prompt(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<string> {
		this.log.info('evm-lite-core', pkg.dependencies[`evm-lite-core`]);
		this.log.info(
			'evm-lite-keystore',
			pkg.dependencies[`evm-lite-keystore`]
		);
		this.log.info('evm-lite-datadir', pkg.dependencies[`evm-lite-datadir`]);
		this.log.info('evm-lite-utils', pkg.dependencies[`evm-lite-utils`]);
		this.log.info('evm-lite-client', pkg.dependencies[`evm-lite-client`]);
		this.log.info(
			'evm-lite-consensus',
			pkg.dependencies[`evm-lite-consensus`]
		);

		if (this.args.options.json) {
			return JSON.stringify({
				version: `v${pkg.version}`
			});
		} else {
			return `v${pkg.version}`;
		}
	}
}

export const Version = VersionCommand;

import * as mkdir from 'mkdirp';

import figlet from 'figlet';

import Vorpal, { Command } from 'vorpal';

import chalk from 'chalk';
import Utils from 'evm-lite-utils';

import color from './color';
import Session from './Session';

// default commands
import clear from '../commands/clear';
import help from '../commands/help';
import interactive from '../commands/interactive';

export type CommandFunction = (evmlc: Vorpal, session: Session) => Command;

export type CLIOptions = {
	name: string;
	delimiter: string;

	// data directory path
	datadir: string;

	// config file name (usually application name)
	config: string;
};

export default async function init(opts: CLIOptions, commands: any) {
	commands.push(interactive, clear);

	if (!Utils.exists(opts.datadir)) {
		mkdir.sync(opts.datadir);
	}

	let dataDirPath = opts.datadir;

	if (process.argv[2] === '--datadir' || process.argv[2] === '-d') {
		dataDirPath = process.argv[3];

		if (!Utils.exists(process.argv[3])) {
			color.yellow(
				'Data directory path provided does ' +
					'not exist and will created.'
			);
		}

		process.argv.splice(2, 2);
	}

	const session = new Session(dataDirPath, opts.config);
	const cli = new Vorpal();

	// custom overrides
	const exit = cli.find('exit');
	if (exit) {
		exit.description(`Exit ${opts.name}`);
	}
	const helpCMD = cli.find('help');
	if (helpCMD) {
		helpCMD.remove();
	}

	// add custom help command
	help(cli, session);

	if (!process.argv[2]) {
		process.argv[2] = 'help';
	}

	commands.forEach((command: CommandFunction) => {
		command(cli, session)
			.option('--debug', 'set logging level to debug')
			.option('--error', 'set logging level to error')
			.option('--silent', 'silence all logging');
	});

	if (process.argv[2] === 'interactive' || process.argv[2] === 'i') {
		cli.log(
			chalk.bold(
				figlet.textSync(opts.name, {
					horizontalLayout: 'full'
				})
			)
		);

		color.yellow(` Mode:        Interactive`);
		color.blue(` Data Dir:    ${session.datadir.path}`);
		color.purple(` Config File: ${session.datadir.configPath}`);
		color.purple(` Keystore:    ${session.datadir.keystorePath}`);

		session.interactive = true;

		const cmdInteractive = cli.find('interactive');
		if (cmdInteractive) {
			cmdInteractive.remove();
		}

		await cli.exec('help');

		cli.delimiter(`${opts.delimiter}$`).show();
	} else {
		const cmdClear = cli.find('clear');
		const cmdDebug = cli.find('debug');

		if (cmdClear) {
			cmdClear.remove();
		}

		if (cmdDebug) {
			cmdDebug.remove();
		}

		cli.parse(process.argv);
	}
}

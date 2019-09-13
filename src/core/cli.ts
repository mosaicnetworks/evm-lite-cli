import * as figlet from 'figlet';
import * as mkdir from 'mkdirp';

import { IAbstractConsensus } from 'evm-lite-consensus';

import Vorpal, { Command } from 'vorpal';

import chalk from 'chalk';
import Utils from 'evm-lite-utils';

import color from './color';
import Session from './Session';

// default commands
// import clear from '../commands/clear';
// import debug from '../commands/debug';
// import interactive from '../commands/interactive';

export type CommandFunction = (evmlc: Vorpal, session: Session) => Command;

export interface ICLIConfig {
	name: string;
	delimiter: string;

	// data directory path
	datadir: string;

	// config file name (usually application name)
	config: string;
}

export default async function init<TConsensus extends IAbstractConsensus>(
	params: ICLIConfig,
	commands: any
) {
	// commands.push(interactive, debug, clear);

	if (!Utils.exists(params.datadir)) {
		mkdir.sync(params.datadir);
	}

	let dataDirPath = params.datadir;

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

	const session = new Session(dataDirPath, params.config);

	if (!process.argv[2]) {
		console.log(
			`\n  Change datadir by: ${params.delimiter} --datadir [path] [command]`
		);
		console.log(`\n  Data Directory: ${session.datadir.path}`);

		process.argv[2] = 'help';
	}

	const cli = new Vorpal();

	commands.forEach((command: CommandFunction) => {
		command(cli, session);
	});

	if (process.argv[2] === 'interactive' || process.argv[2] === 'i') {
		console.log(
			chalk.bold(
				figlet.textSync(params.name, {
					horizontalLayout: 'full'
				})
			)
		);

		if (process.argv[3] === '-d' || process.argv[3] === '--debug') {
			session.debug = true;
			color.yellow(` Debug:       True`);
		}

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

		cli.delimiter(`${params.delimiter}$`).show();
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

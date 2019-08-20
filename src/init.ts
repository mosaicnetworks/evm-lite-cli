import * as figlet from 'figlet';
import * as mkdir from 'mkdirp';

import { IAbstractConsensus } from 'evm-lite-solo';

import Vorpal, { Command } from 'vorpal';

import chalk from 'chalk';
import Utils from 'evm-lite-utils';

import Globals from './Globals';
import Session from './Session';

// default commands
// import clear from './cmd/clear';
// import debug from './cmd/debug';
// import interactive from './cmd/interactive';

export type CommandFunction<TConsensus extends IAbstractConsensus> = (
	evmlc: Vorpal,
	session: Session<TConsensus>
) => Command;

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
	consensus: new (host: string, port: number) => TConsensus,
	commands: Array<CommandFunction<TConsensus>>
) {
	// commands.push(interactive, debug, clear);

	if (!Utils.exists(params.datadir)) {
		mkdir.sync(params.datadir);
	}

	let dataDirPath = params.datadir;

	if (process.argv[2] === '--datadir' || process.argv[2] === '-d') {
		dataDirPath = process.argv[3];

		if (!Utils.exists(process.argv[3])) {
			Globals.warning(
				'Data directory path provided does ' +
					'not exist and will created.'
			);
		}

		process.argv.splice(2, 2);
	}

	const session = new Session<TConsensus>(
		dataDirPath,
		params.config,
		consensus
	);

	if (!process.argv[2]) {
		console.log(
			`\n  Change datadir by: ${
				params.delimiter
			} --datadir [path] [command]`
		);
		console.log(`\n  Data Directory: ${session.datadir.path}`);

		process.argv[2] = 'help';
	}

	const cli = new Vorpal();

	commands.forEach((command: CommandFunction<TConsensus>) => {
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
			Globals.warning(` Debug:       True`);
		}

		Globals.warning(` Mode:        Interactive`);
		Globals.info(` Data Dir:    ${session.datadir.path}`);
		Globals.purple(` Config File: ${session.datadir.configPath}`);
		Globals.purple(` Keystore:    ${session.datadir.keystorePath}`);

		const cmdInteractive = cli.find('interactive');
		if (cmdInteractive) {
			cmdInteractive.remove();
		}

		await cli.exec('help');

		session.interactive = true;
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

#!/usr/bin/env node

require('dotenv').config();

import * as figlet from 'figlet';
import * as mkdir from 'mkdirp';

import Vorpal, { Command } from 'vorpal';

import { Utils } from 'evm-lite-keystore';

import Globals from './Globals';
import Session from './Session';

// Accounts
import accountsCreate from './cmd/accounts-create';
import accountsGet from './cmd/accounts-get';
import accountsList from './cmd/accounts-list';
import accountsUpdate from './cmd/accounts-Update';

// Config
import configView from './cmd/config-view';

// Misc
import clear from './cmd/clear';
import interactive from './cmd/interactive';
import transfer from './cmd/transfer';
import info from './cmd/info';
import version from './cmd/version';
import test from './cmd/test';

export type CommandFunction = (evmlc: Vorpal, session: Session) => Command;

const init = (): Promise<void> => {
	return new Promise<void>(resolve => {
		if (!Utils.exists(Globals.evmlcDir)) {
			mkdir.sync(Globals.evmlcDir);
		}
		resolve();
	});
};

/**
 * EVM-Lite Command Line Interface
 *
 * You can enter interactive mode by using the command `interactive, i`.
 * Running any command will provide you with a step by step dialogue to executing
 * that command with the respective options.
 */
init()
	.then(() => {
		let dataDirPath: string = Globals.evmlcDir;

		if (process.argv[2] === '--datadir' || process.argv[2] === '-d') {
			dataDirPath = process.argv[3];

			if (!Utils.exists(process.argv[3])) {
				Globals.warning(
					'Data directory file path provided does' +
						'not exist and hence will created...'
				);
			}

			process.argv.splice(2, 2);
		}

		const session = new Session(dataDirPath);

		if (!process.argv[2]) {
			console.log(
				'\n  A Command Line Interface to interact with EVM-Lite.'
			);
			console.log(
				`\n  Current Data Directory: ` + session.directory.path
			);

			process.argv[2] = 'help';
		}

		return session;
	})
	.then((session: Session) => {
		const evmlc = new Vorpal();

		[
			// accounts
			accountsCreate,
			accountsGet,
			accountsList,
			accountsUpdate,

			// config
			configView,

			// misc
			clear,
			interactive,
			info,
			test,
			version,
			transfer
		].forEach((command: CommandFunction) => {
			command(evmlc, session);
		});

		return {
			instance: evmlc,
			session
		};
	})
	.then(async (cli: { instance: Vorpal; session: Session }) => {
		if (process.argv[2] === 'interactive' || process.argv[2] === 'i') {
			console.log(figlet.textSync('EVM-Lite CLI', {}));
			Globals.warning(` Mode:        Interactive`);
			Globals.warning(` Data Dir:    ${cli.session.directory.path}`);
			Globals.info(` Config File: ${cli.session.config.path}`);

			if (cli.session.keystore) {
				Globals.info(` Keystore:    ${cli.session.keystore.path}`);
			}

			const cmdInteractive = cli.instance.find('interactive');
			if (cmdInteractive) {
				cmdInteractive.hidden();
			}

			await cli.instance.exec('help');

			cli.session.interactive = true;
			cli.instance.delimiter('evmlc$').show();
		} else {
			const cmdClear = cli.instance.find('clear');
			if (cmdClear) {
				cmdClear.hidden();
			}

			cli.instance.parse(process.argv);
		}
	})
	.catch(console.log);

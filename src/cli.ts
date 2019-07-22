#!/usr/bin/env node

require('dotenv').config();

import * as figlet from 'figlet';
import * as mkdir from 'mkdirp';

import Vorpal, { Command } from 'vorpal';

import Utils from 'evm-lite-utils';

import Globals from './Globals';
import Session from './Session';

// Accounts
import accountsCreate from './cmd/accounts-create';
import accountsGet from './cmd/accounts-get';
import accountsList from './cmd/accounts-list';
import accountsUpdate from './cmd/accounts-update';
import accountsImport from './cmd/accounts-import';

// Config
import configView from './cmd/config-view';
import configSet from './cmd/config-set';

// poa
import poaCheck from './cmd/poa-check';
import poaInfo from './cmd/poa-info';
import poaWhitelist from './cmd/poa-whitelist';
import poaNomineelist from './cmd/poa-nomineelist';
import poaNominate from './cmd/poa-nominate';
import poaVote from './cmd/poa-vote';
import poaInit from './cmd/poa-init';

// Misc
import clear from './cmd/clear';
import interactive from './cmd/interactive';
import transfer from './cmd/transfer';
import info from './cmd/info';
import version from './cmd/version';
import test from './cmd/test';
import chalk from 'chalk';

export type CommandFunction = (evmlc: Vorpal, session: Session) => Command;

const init = (): Promise<void> => {
	return new Promise<void>(resolve => {
		if (!Utils.exists(Globals.evmlcDir)) {
			mkdir.sync(Globals.evmlcDir);
		}
		resolve();
	});
};

init()
	.then(() => {
		let dataDirPath: string = Globals.evmlcDir;

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
			accountsImport,

			// config
			configView,
			configSet,

			// poa
			poaCheck,
			poaWhitelist,
			poaNomineelist,
			poaNominate,
			poaVote,
			poaInfo,
			poaInit,

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
		var pkg = require('../package.json');

		if (process.argv[2] === 'interactive' || process.argv[2] === 'i') {
			let title = 'EVM-Lite CLI';

			if (pkg.bin['monet'] || false) {
				title = 'Monet CLI';
			}

			console.log(
				chalk.bold(
					figlet.textSync(title, {
						horizontalLayout: 'full'
					})
				)
			);

			if (process.argv[3] === '-d' || process.argv[3] === '--debug') {
				cli.session.debug = true;
				Globals.warning(` Debug:       True`);
			}

			Globals.warning(` Mode:        Interactive`);
			Globals.info(` Data Dir:    ${cli.session.directory.path}`);
			Globals.purple(` Config File: ${cli.session.config.path}`);

			if (cli.session.keystore) {
				Globals.purple(` Keystore:    ${cli.session.keystore.path}`);
			}

			const cmdInteractive = cli.instance.find('interactive');
			if (cmdInteractive) {
				cmdInteractive.hidden();
			}

			await cli.instance.exec('help');

			cli.session.interactive = true;

			let delimter = 'evmlc';

			if (pkg.bin['monet'] || false) {
				delimter = 'monet';
			}

			cli.instance.delimiter(`${delimter}$`).show();
		} else {
			const cmdClear = cli.instance.find('clear');

			if (cmdClear) {
				cmdClear.hidden();
			}

			cli.instance.parse(process.argv);
		}
	})
	.catch(console.log);

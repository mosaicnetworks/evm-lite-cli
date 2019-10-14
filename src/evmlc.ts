#!/usr/bin/env node

import { osdatadir } from 'evm-lite-datadir';

// commands
import accountsCreate from './commands/accounts-create';
import accountsGet from './commands/accounts-get';
import accountsImport from './commands/accounts-import';
import accountsList from './commands/accounts-list';
import accountsPrivateKey from './commands/accounts-privatekey';
import accountsUpdate from './commands/accounts-update';

import configSet from './commands/config-set';
import configView from './commands/config-view';

import poaCheck from './commands/poa-check';
import poaEvicteesList from './commands/poa-evictees-list';
import poaEvicteesNew from './commands/poa-evictees-new';
import poaEvicteesVote from './commands/poa-evictees-vote';
import poaInit from './commands/poa-init';
import poaNomineesList from './commands/poa-nominees-list';
import poaNomineesNew from './commands/poa-nominees-new';
import poaNomineesVote from './commands/poa-nominees-vote';
import poaWhitelist from './commands/poa-whitelist';

import info from './commands/info';
import test from './commands/test';
import transfer from './commands/transfer';
import version from './commands/version';

import init, { CLIOptions } from './core/cli';

const options: CLIOptions = {
	name: 'EVMLC',
	delimiter: 'evmlc',
	datadir: osdatadir('evmlite'),
	config: 'evmlc'
};

const commands = [
	info,

	configSet,
	configView,

	accountsList,
	accountsGet,
	accountsCreate,
	accountsUpdate,
	accountsImport,

	transfer,

	poaInit,
	poaWhitelist,
	poaCheck,

	poaNomineesList,
	poaNomineesNew,
	poaNomineesVote,

	poaEvicteesList,
	poaEvicteesNew,
	poaEvicteesVote,

	version
];

init(options, commands).catch(console.log);

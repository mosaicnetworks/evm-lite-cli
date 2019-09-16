#!/usr/bin/env node

import { osdatadir } from 'evm-lite-datadir';

// commands
import accountsCreate from './commands/accounts-create';
import accountsGet from './commands/accounts-get';
import accountsImport from './commands/accounts-import';
import accountsList from './commands/accounts-list';
import accountsUpdate from './commands/accounts-update';

import configSet from './commands/config-set';
import configView from './commands/config-view';

import poaCheck from './commands/poa-check';
import poaInit from './commands/poa-init';

import info from './commands/info';
import transfer from './commands/transfer';
import version from './commands/version';

import init, { ICLIConfig } from './core/cli';

const params: ICLIConfig = {
	name: 'EVM-Lite CLI',
	delimiter: 'evmlc',
	datadir: osdatadir('evmlite'),
	config: 'evmlc'
};

const commands = [
	// accounts
	accountsCreate,
	accountsList,
	accountsGet,
	accountsUpdate,
	accountsImport,

	// config
	configView,
	configSet,

	poaInit,
	poaCheck,

	info,
	transfer,
	version
];

init(params, commands).catch(console.log);

#!/usr/bin/env node

import { osdatadir } from 'evm-lite-datadir';

// commands
import accountsCreate from './commands/accounts-create';
import accountsGet from './commands/accounts-get';
import accountsList from './commands/accounts-list';
import accountsUpdate from './commands/accounts-update';

import configSet from './commands/config-set';
import configView from './commands/config-view';

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

	// config
	configView,
	configSet
];

init(params, commands).catch(console.log);

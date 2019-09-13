#!/usr/bin/env node

import { osdatadir } from 'evm-lite-datadir';

// commands
import accountsCreate from './commands/accounts-create';
import accountsGet from './commands/accounts-get';
import accountsList from './commands/accounts-list';
import accountsUpdate from './commands/accounts-update';

import init, { ICLIConfig } from './core/cli';

const params: ICLIConfig = {
	name: 'EVM-Lite CLI',
	delimiter: 'evmlc',
	datadir: osdatadir('evmlite'),
	config: 'evmlc'
};

const commands = [accountsCreate, accountsList, accountsGet, accountsUpdate];

init(params, commands).catch(console.log);

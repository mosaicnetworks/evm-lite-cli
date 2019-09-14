import * as fs from 'fs';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node from 'evm-lite-core';
import utils, { Currency, IUnits } from 'evm-lite-utils';

import { AbstractKeystore } from 'evm-lite-keystore';

import color from '../core/color';
import Session from '../core/Session';

import Command, { IArgs, IOptions } from '../core/Command';

interface Opts extends IOptions {
	interactive?: boolean;

	host: string;
	port: number;

	pwd: string;

	// tx
	from: string;
	to: string;
	gas: number;
	gasprice: number;
	value: string;
}

interface Args extends IArgs<Opts> {}

interface FirstAnswers {
	from: string;
	passphrase: string;
	to: string;
	value: string;
	gas: number;
	gasPrice: number;
}

interface SecondAnswers {
	send: boolean;
}

function isLetter(str: string) {
	return str.length === 1 && str.match(/[a-z]/i);
}

export default (evmlc: Vorpal, session: Session): Command => {
	const description = 'Initiate a transfer of token(s) to an address';

	return evmlc
		.command('transfer')
		.alias('t')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-v, --value <value>', 'value to send')
		.option('-g, --gas <value>', 'gas')
		.option('-gp, --gasprice <value>', 'gas price')
		.option('-t, --to <address>', 'send to address')
		.option('-f, --from <moniker>', 'moniker of sender')
		.option('--pwd <password>', 'passphrase file path')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['t', 'to', 'f', 'from', 'h', 'host', 'pwd']
		})
		.action((args: Args) => new TransferCommand(session, args).run());
};

class TransferCommand extends Command<Args> {
	// command level variable
	protected passphrase: string = '';
	protected send: boolean = false;
	protected unit: IUnits = 'T';

	protected async init(): Promise<boolean> {
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		// check if gas, gasprice is negative or undefined/null
		if (
			this.args.options.gas < 0 ||
			this.args.options.gas === undefined ||
			this.args.options.gas === null
		) {
			this.args.options.gas = this.config.defaults.gas;
		}

		if (
			this.args.options.gasprice < 0 ||
			this.args.options.gasprice === undefined ||
			this.args.options.gasprice === null
		) {
			this.args.options.gasprice = this.config.defaults.gasPrice;
		}

		this.args.options.from =
			this.args.options.from || this.config.defaults.from;

		// set node object to used by interactive() and exec()
		this.node = new Node(this.args.options.host, this.args.options.port);

		// default send to true if not in interactive
		if (!this.args.options.interactive) {
			this.send = true;
		}

		return this.args.options.interactive;
	}

	protected async interactive(): Promise<void> {
		const keystore = await this.datadir.listKeyfiles();

		const accounts: any = await Promise.all(
			Object.keys(keystore).map(async moniker => {
				const base = await this.node!.getAccount(
					keystore[moniker].address
				);

				return {
					...base,
					moniker
				};
			})
		);

		const first: Inquirer.QuestionCollection<FirstAnswers> = [
			{
				choices: accounts.map(
					(acc: any) => `${acc.moniker} (${acc.balance.format('T')})`
				),
				message: 'From: ',
				name: 'from',
				type: 'list'
			},
			{
				message: 'Enter password: ',
				name: 'passphrase',
				type: 'password'
			},
			{
				message: 'To',
				name: 'to',
				type: 'input'
			},
			{
				default: '100',
				message: 'Value: ',
				name: 'value',
				type: 'input'
			},
			{
				default: this.config.defaults.gas || 100000,
				message: 'Gas: ',
				name: 'gas',
				type: 'number'
			},
			{
				default: this.config.defaults.gasPrice || 0,
				message: 'Gas Price: ',
				name: 'gasPrice',
				type: 'number'
			}
		];

		const second: Inquirer.QuestionCollection<SecondAnswers> = [
			{
				message: 'Submit transaction',
				name: 'send',
				type: 'confirm'
			}
		];

		const answers = await Inquirer.prompt<FirstAnswers>(first);

		this.args.options.from = utils.trimHex(answers.from.split(' ')[0]);
		this.args.options.to = answers.to;
		this.args.options.value = answers.value;
		this.args.options.gas = answers.gas;
		this.args.options.gasprice = answers.gasPrice;

		this.passphrase = answers.passphrase.trim();

		const tx = {
			from: this.args.options.from,
			to: this.args.options.to,
			value: this.args.options.value,
			gas: this.args.options.gas,
			gasPrice: this.args.options.gasprice
		};

		color.blue(JSON.stringify(tx, null, 2));

		const { send } = await Inquirer.prompt<SecondAnswers>(second);

		this.send = send;
	}

	protected async check(): Promise<void> {
		if (!this.args.options.from) {
			throw Error('No `from` moniker provided or set in config.');
		}

		if (!this.passphrase) {
			if (!this.args.options.pwd) {
				throw Error('--pwd file path not provided.');
			}

			if (!utils.exists(this.args.options.pwd)) {
				throw Error('--pwd file path provided does not exist.');
			}

			if (utils.isDirectory(this.args.options.pwd)) {
				throw Error('--pwd file path provided is a directory.');
			}

			this.passphrase = fs
				.readFileSync(this.args.options.pwd, 'utf8')
				.trim();
		}

		if (!this.args.options.to || !this.args.options.value) {
			throw Error('Provide `to` address and `value` to send');
		}

		if (utils.trimHex(this.args.options.to).length !== 40) {
			throw Error('Invalid `to` address');
		}

		const u = this.args.options.value.toString().slice(-1) as IUnits;

		if (isLetter(u)) {
			this.unit = u;
			this.args.options.value = this.args.options.value.slice(0, -1);
		}
	}

	protected async exec(): Promise<void> {
		const keyfile = await this.datadir.getKeyfile(this.args.options.from);
		const account = AbstractKeystore.decrypt(keyfile, this.passphrase);

		const value = new Currency(this.args.options.value + this.unit).format(
			'a'
		);

		const receipt = await this.node!.transfer(
			account,
			this.args.options.to,
			value.slice(0, -1),
			this.args.options.gas,
			this.args.options.gasprice
		);

		return color.green(JSON.stringify(receipt, null, 2));
	}
}

export const Transfer = TransferCommand;

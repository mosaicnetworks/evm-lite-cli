import * as fs from 'fs';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node from 'evm-lite-core';
import Datadir from 'evm-lite-datadir';
import utils, { Currency, IUnits } from 'evm-lite-utils';

import color from '../core/color';
import Session from '../core/Session';

import Command, { Arguments, TxOptions } from '../core/TxCommand';

type Opts = TxOptions & {
	interactive?: boolean;

	host: string;
	port: number;

	pwd: string;

	// tx
	from: string;
	to: string;
	value: string;
};

type Args = Arguments<Opts> & {};

type FirstAnswers = {
	to: string;
	value: string;
};

type SecondAnswers = {
	send: boolean;
};

function isLetter(str: string) {
	return str.length === 1 && str.match(/[a-z]/i);
}

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Initiate a transfer of token(s) to an address';

	return evmlc
		.command('transfer')
		.alias('t')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-v, --value <value>', 'value to send')
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
	protected send: boolean = false;

	protected async init(): Promise<boolean> {
		this.payable = true;
		this.transfer = true;

		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

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

	protected async prompt(): Promise<void> {
		const first: Inquirer.QuestionCollection<FirstAnswers> = [
			{
				message: 'To',
				name: 'to',
				type: 'input'
			},
			{
				message: 'Value: ',
				name: 'value',
				type: 'input'
			}
		];

		const answers = await Inquirer.prompt<FirstAnswers>(first);

		this.args.options.to = answers.to;
		this.args.options.value = answers.value;

		const u = this.args.options.value.toString().slice(-1) as IUnits;
		if (!isLetter(u)) {
			this.args.options.value = this.args.options.value + 'T';
		}
	}

	protected async check(): Promise<void> {
		// check from and passphrase path if account not already decrypted
		// mostly likely to occur in only non interactive mode
		if (!this.account) {
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
		}

		if (!this.args.options.to || !this.args.options.value) {
			throw Error('Provide `to` address and `value` to send');
		}

		if (utils.trimHex(this.args.options.to).length !== 40) {
			throw Error('Invalid `to` address');
		}
	}

	protected async exec(): Promise<string> {
		// sanity check
		if (!this.account) {
			const keyfile = await this.datadir.getKeyfile(
				this.args.options.from
			);

			this.account = Datadir.decrypt(keyfile, this.passphrase!);
		}

		if (this.args.options.interactive) {
			const second: Inquirer.QuestionCollection<SecondAnswers> = [
				{
					message: 'Submit transaction',
					name: 'send',
					type: 'confirm'
				}
			];

			const gp = new Currency(
				this.args.options.gasPrice === '0'
					? 0
					: this.args.options.gasPrice + 'a'
			);
			const tx = {
				from: this.account!.address,
				to: this.args.options.to,
				value: new Currency(this.args.options.value).format('T'),
				gas: this.args.options.gas,
				gasPrice: gp.format('T')
			};

			color.yellow(JSON.stringify(tx, null, 2));
			color.yellow(
				`Transaction fee: ${gp
					.times(this.args.options.gas || 21000)
					.format('T')}`
			);

			const { send } = await Inquirer.prompt<SecondAnswers>(second);

			this.send = send;
		}

		if (!this.send) {
			return 'Aborted';
		}

		this.startSpinner('Sending Transaction');

		console.log(Number(this.args.options.gasPrice));
		const receipt = await this.node!.transfer(
			this.account!,
			this.args.options.to,
			new Currency(this.args.options.value).format('a').slice(0, -1),
			21000,
			Number(this.args.options.gasPrice)
		);

		this.stopSpinner();

		return JSON.stringify(receipt, null, 2);
	}
}

export const Transfer = TransferCommand;

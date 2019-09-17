import * as fs from 'fs';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import Datadir from 'evm-lite-datadir';
import utils from 'evm-lite-utils';

import color from '../core/color';
import Session from '../core/Session';

import Command, { IArgs, IOptions } from '../core/Command';

interface Opts extends IOptions {
	interactive?: boolean;
	moniker: string;
	from: string;
	pwd?: string;
	host: string;
	port: number;
	gas: number;
	gasprice: number;
}

interface Args extends IArgs<Opts> {
	address: string;
}

interface Answers {
	from: string;
	address: string;
	passphrase: string;
	nomineeMoniker: string;
	gas: number;
	gasPrice: number;
}

export default (evmlc: Vorpal, session: Session): Command => {
	const description = 'Nominate an address to proceed to election';

	return evmlc
		.command('poa nominate [address]')
		.alias('p n')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('--pwd <password>', 'passphase file path')
		.option('--moniker <moniker>', 'moniker of the nominee')
		.option('--from <moniker>', 'from moniker')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('-g, --gas <g>', 'override config gas value')
		.option('-gp, --gasprice <gp>', 'override config gasprice value')
		.types({
			string: ['_', 'pwd', 'moniker', 'from', 'h', 'host']
		})
		.action(
			(args: Args): Promise<void> =>
				new POANominateCommand(session, args).run()
		);
};

class POANominateCommand extends Command<Args> {
	protected passphrase: string = '';

	protected async init(): Promise<boolean> {
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		if (!this.args.options.gas && this.args.options.gas !== 0) {
			this.args.options.gas = this.config.defaults.gas;
		}

		if (!this.args.options.gasprice && this.args.options.gasprice !== 0) {
			this.args.options.gasprice = this.config.defaults.gasPrice;
		}

		this.args.options.from =
			this.args.options.from || this.config.defaults.from;

		this.node = new Node(this.args.options.host, this.args.options.port);

		return this.args.options.interactive;
	}

	protected async interactive(): Promise<void> {
		const keystore = await this.datadir.listKeyfiles();

		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				choices: Object.keys(keystore).map(moniker => moniker),
				message: 'From: ',
				name: 'from',
				type: 'list'
			},
			{
				message: 'Passphrase: ',
				name: 'passphrase',
				type: 'password'
			},
			{
				default: keystore[this.args.options.from].address || '',
				message: 'Nominee: ',
				name: 'address',
				type: 'input'
			},
			{
				default: this.args.options.from || '',
				message: 'Nominee Moniker: ',
				name: 'nomineeMoniker',
				type: 'input'
			},
			{
				default: this.args.options.gas || 100000,
				message: 'Gas: ',
				name: 'gas',
				type: 'number'
			},
			{
				default: this.args.options.gasprice || 0,
				message: 'Gas Price: ',
				name: 'gasPrice',
				type: 'number'
			}
		];

		const answers = await Inquirer.prompt<Answers>(questions);

		this.args.address = utils.trimHex(answers.address);

		this.args.options.from = answers.from;
		this.args.options.moniker = answers.nomineeMoniker;
		this.args.options.gas = answers.gas;
		this.args.options.gasprice = answers.gasPrice;

		this.passphrase = answers.passphrase;
	}

	protected async check(): Promise<void> {
		if (!this.args.address) {
			throw Error('No nominee address provided.');
		}

		if (utils.trimHex(this.args.address).length !== 40) {
			throw Error('Nominee address has an invalid length.');
		}

		if (!this.args.options.moniker) {
			throw Error('No moniker provided for nominee.');
		}

		if (!this.args.options.from) {
			throw Error('No `from` moniker provided or set in config.');
		}

		if (!this.passphrase) {
			if (!this.args.options.pwd) {
				throw Error('Passphrase file path not provided.');
			}

			if (!utils.exists(this.args.options.pwd)) {
				throw Error('Passphrase file path provided does not exist.');
			}

			if (utils.isDirectory(this.args.options.pwd)) {
				throw Error('Passphrase file path provided is a directory.');
			}

			this.passphrase = fs
				.readFileSync(this.args.options.pwd, 'utf8')
				.trim();
		}
	}

	protected async exec(): Promise<void> {
		this.log.http(
			'GET',
			`${this.args.options.host}:${this.args.options.port}/poa`
		);

		const poa = await this.node!.getPOA();

		this.log.info('POA', poa.address);

		const contract = Contract.load(JSON.parse(poa.abi), poa.address);

		const keyfile = await this.datadir.getKeyfile(this.args.options.from);
		const account = Datadir.decrypt(keyfile, this.passphrase);

		const tx = contract.methods.submitNominee(
			{
				from: keyfile.address,
				gas: this.args.options.gas,
				gasPrice: this.args.options.gasprice
			},
			utils.cleanAddress(this.args.address),
			this.args.options.moniker
		);

		const receipt = await this.node!.sendTx(tx, account);

		if (!receipt.logs.length) {
			throw Error(
				'No logs were returned. ' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			);
		}

		let monikerAnnouceEvent;
		const monikerAnnouceEvents = receipt.logs.filter(
			log => log.event === 'MonikerAnnounce'
		);

		const nomineeProposedEvent = receipt.logs.filter(
			log => log.event === 'NomineeProposed'
		)[0];

		if (monikerAnnouceEvents.length > 1) {
			try {
				monikerAnnouceEvent = monikerAnnouceEvents.filter(event => {
					const moniker = utils
						.hexToString(event.args._moniker)
						.toLowerCase();

					if (moniker.trim() === this.args.options.moniker.trim()) {
						return event;
					}
				})[0];
			} catch (e) {
				throw Error(
					'No logs were returned matching the specified `moniker`.'
				);
			}
		} else {
			monikerAnnouceEvent = monikerAnnouceEvents[0];
		}

		if (!monikerAnnouceEvent) {
			throw Error(
				'No logs were returned matching the specified `moniker`.'
			);
		}

		return color.green(
			`You (${
				nomineeProposedEvent.args._proposer
			}) nominated '${utils.hexToString(
				monikerAnnouceEvent.args._moniker
			)}' (${nomineeProposedEvent.args._nominee})`
		);
	}
}

export const POANominate = POANominateCommand;

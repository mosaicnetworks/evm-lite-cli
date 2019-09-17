import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import utils from 'evm-lite-utils';

import color from '../core/color';
import Session from '../core/Session';

import Command, { IArgs, IOptions } from '../core/Command';

interface Opts extends IOptions {
	interactive?: boolean;
	host: string;
	port: number;
	gas: number;
	gasprice: number;
}

interface Args extends IArgs<Opts> {
	address: string;
}

interface Answers {
	address: string;
	gas: number;
	gasPrice: number;
}

export default (evmlc: Vorpal, session: Session): Command => {
	const description = 'Check whether an address is on the whitelist';

	return evmlc
		.command('poa check [address]')
		.alias('p c')
		.description(description)
		.option('-i, --interactive', 'enter interactive')
		.option('-d, --debug', 'show debug output')
		.option('-g, --gas <g>', 'override config gas value')
		.option('-gp, --gasprice <gp>', 'override config gasprice value')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['_', 'from', 'h', 'host']
		})
		.action(
			(args: Args): Promise<void> =>
				new POACheckCommand(session, args).run()
		);
};

class POACheckCommand extends Command<Args> {
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

		this.node = new Node(this.args.options.host, this.args.options.port);

		return this.args.options.interactive;
	}

	protected async interactive(): Promise<void> {
		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				message: 'Nominee address: ',
				name: 'address',
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

		this.args.address = answers.address;

		this.args.options.gas = answers.gas;
		this.args.options.gasprice = answers.gasPrice;
	}

	protected async check(): Promise<void> {
		if (utils.trimHex(this.args.address).length !== 40) {
			throw Error('Nominee address has an invalid length.');
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

		const tx = contract.methods.checkAuthorised(
			{
				gas: this.args.options.gas,
				gasPrice: this.args.options.gasprice
			},
			utils.cleanAddress(this.args.address)
		);

		const response = await this.node!.callTx<boolean>(tx);

		return color.green(response);
	}
}

export const POACheck = POACheckCommand;

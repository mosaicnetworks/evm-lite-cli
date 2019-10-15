import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import utils, { Currency } from 'evm-lite-utils';

import Session from '../core/Session';

import Command, { Arguments, TxOptions } from '../core/TxCommand';

type Opts = TxOptions & {
	host: string;
	port: number;
};

type Args = Arguments<Opts> & {
	address: string;
};

type Answers = {
	address: string;
};

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Check whether an address is on the whitelist';

	return evmlc
		.command('poa check [address]')
		.alias('p c')
		.description(description)
		.option('-i, --interactive', 'enter interactive')
		.option('-d, --debug', 'show debug output')
		.option('-g, --gas <g>', 'override config gas value')
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
		this.constant = true;

		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		if (!this.args.options.gas && this.args.options.gas !== 0) {
			this.args.options.gas = this.config.defaults.gas;
		}

		this.node = new Node(this.args.options.host, this.args.options.port);

		return this.args.options.interactive;
	}

	protected async prompt(): Promise<void> {
		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				message: 'Nominee address: ',
				name: 'address',
				type: 'input'
			}
		];

		const answers = await Inquirer.prompt<Answers>(questions);

		this.args.address = answers.address;
	}

	protected async check(): Promise<void> {
		if (utils.trimHex(this.args.address).length !== 40) {
			throw Error('Nominee address has an invalid length.');
		}
	}

	protected async exec(): Promise<string> {
		this.log.http(
			'GET',
			`${this.args.options.host}:${this.args.options.port}/poa`
		);

		const poa = await this.node!.getPOA();

		this.log.info('POA', poa.address);

		const contract = Contract.load(JSON.parse(poa.abi), poa.address);

		this.debug('Generating checkAuthorised transaction');
		const tx = contract.methods.checkAuthorised(
			{
				gas: this.args.options.gas,
				gasPrice: this.args.options.gasPrice
			},
			utils.cleanAddress(this.args.address)
		);

		this.debug('Sending transaction');
		const response = await this.node!.callTx<boolean>(tx);

		return response.toString();
	}
}

export const POACheck = POACheckCommand;

import * as fs from 'fs';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import Datadir from 'evm-lite-datadir';
import utils from 'evm-lite-utils';

import Session from '../core/Session';
import POA, { EvicteeEntry } from '../poa/Contract';

import { EvictionDecision, EvictionVoteCast, Logs } from '../poa';

import Command, { Arguments, TxOptions } from '../core/TxCommand';

type Opts = TxOptions & {
	interactive?: boolean;
	pwd?: string;

	verdict: string;
	from: string;
	host: string;
	port: number;
	gas: number;
};

type Args = Arguments<Opts> & {
	address: string;
};

type Answers = {
	address: string;
	verdict: string;
};

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Vote for an evictee in election';

	return evmlc
		.command('poa evictee vote [address]')
		.alias('p e v')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('-d, --debug', 'show debug output')
		.option(
			'--verdict <Yes|No|yes|no>',
			'verdict for given eviction nominee'
		)
		.option('--pwd <password>', 'passphrase file path')
		.option('--from <moniker>', 'from moniker')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('-g, --gas <g>', 'override config gas value')
		.types({
			string: ['_', 'from', 'pwd', 'host', 'h']
		})
		.action(
			(args: Args): Promise<void> =>
				new POAEvictionVoteCommand(session, args).run()
		);
};

class POAEvictionVoteCommand extends Command<Args> {
	protected evictees: EvicteeEntry[] = [];

	protected async init(): Promise<boolean> {
		this.payable = true;

		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		if (!this.args.options.gas && this.args.options.gas !== 0) {
			this.args.options.gas = this.config.defaults.gas;
		}

		this.args.options.from =
			this.args.options.from || this.config.defaults.from;

		this.node = new Node(this.args.options.host, this.args.options.port);

		return this.args.options.interactive;
	}

	protected async prompt(): Promise<void> {
		const poa = new POA(this.args.options.host, this.args.options.port);
		await poa.init();

		this.evictees = await poa.evictees();

		if (this.evictees.length === 0) {
			throw Error('No evictees to vote for.');
		}

		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				choices: this.evictees.map(e => `${e.moniker} (${e.address})`),
				message: 'Evictee: ',
				name: 'address',
				type: 'list'
			},
			{
				choices: ['Yes', 'No'],
				message: 'Verdict: ',
				name: 'verdict',
				type: 'list'
			}
		];

		const answers = await Inquirer.prompt<Answers>(questions);

		this.args.address = answers.address.split(' ')[1].slice(1, -1);
		this.args.options.verdict = answers.verdict;

		return;
	}

	protected async check(): Promise<void> {
		this.args.options.verdict = this.args.options.verdict.toLowerCase();

		if (!this.args.address) {
			throw Error('No nominee address provided.');
		}

		if (utils.trimHex(this.args.address).length !== 40) {
			throw Error('Nominee address has an invalid length.');
		}

		if (!this.args.options.verdict && this.args.options.verdict !== 'no') {
			throw Error('No verdict provided for nominee.');
		}

		if (!this.account) {
			if (!this.args.options.from) {
				throw Error('No `from` moniker provided or set in config.');
			}

			if (!this.passphrase) {
				if (!this.args.options.pwd) {
					throw Error('Passphrase file path not provided.');
				}

				if (!utils.exists(this.args.options.pwd)) {
					throw Error(
						'Passphrase file path provided does not exist.'
					);
				}

				if (utils.isDirectory(this.args.options.pwd)) {
					throw Error(
						'Passphrase file path provided is a directory.'
					);
				}

				this.passphrase = fs
					.readFileSync(this.args.options.pwd, 'utf8')
					.trim();
			}
		}

		if (!this.args.options.verdict) {
			this.args.options.verdict = 'no';
		}

		if (
			this.args.options.verdict !== 'yes' &&
			this.args.options.verdict !== 'no'
		) {
			throw Error(
				`Verdict argument not recognized: ${this.args.options.verdict}`
			);
		}
	}

	protected async exec(): Promise<string> {
		if (this.args.options.interactive && !this.evictees.length) {
			return 'There are no evitees to vote for.';
		}

		const poa = await this.node!.getPOA();
		const contract = Contract.load(JSON.parse(poa.abi), poa.address);

		// sanity check
		if (!this.account) {
			const keyfile = await this.datadir.getKeyfile(
				this.args.options.from
			);

			this.account = Datadir.decrypt(keyfile, this.passphrase!);
		}

		this.debug('Generating vote transaction');
		const tx = contract.methods.castEvictionVote(
			{
				from: this.account.address,
				gas: this.args.options.gas,
				gasPrice: Number(this.args.options.gasPrice)
			},
			utils.cleanAddress(this.args.address),
			this.args.options.verdict === 'yes' ? true : false
		);

		this.debug('Sending vote transaction');
		const receipt = await this.sendTx(tx, this.account);

		if (!receipt.logs.length) {
			throw Error(
				'No logs were returned. ' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			);
		}

		this.debug('Parsing logs from transaction');
		const logs = new Logs(receipt.logs);

		const evEvictionVoteCast = logs.find<EvictionVoteCast>(
			'EvictionVoteCast'
		);

		const evEvictionDecision = logs.find<EvictionDecision>(
			'EvictionDecision'
		);

		if (!evEvictionVoteCast) {
			throw Error(
				'Vote was not cast. No `EvictionVoteCast` event returned'
			);
		}

		const vote = evEvictionVoteCast._accepted ? 'Yes' : 'No';
		let message =
			`You (${evEvictionVoteCast._voter}) voted '${vote}'` +
			` for '${evEvictionVoteCast._nominee}'. `;

		if (evEvictionDecision) {
			const accepted = evEvictionDecision._accepted
				? 'being removed'
				: 'not being removed';

			message += `\nEviction ended with the nominee ${accepted}.`;
		}

		if (this.args.options.json) {
			return JSON.stringify({
				voter: evEvictionVoteCast._voter,
				evictee: evEvictionVoteCast._nominee,
				verdict: vote
			});
		} else {
			return message;
		}
	}
}

export const POAEvictVote = POAEvictionVoteCommand;

import Inquirer from 'inquirer';

import { IAbstractConsensus, Solo } from 'evm-lite-consensus';
import { Currency } from 'evm-lite-utils';
import { Args } from 'vorpal';

import Datadir from 'evm-lite-datadir';

import Command, { IOptions } from './Command';
import Session from './Session';

// default options for all commands
export interface ITxOptions extends IOptions {
	gas: number;
	gasPrice: string;
}

export type IArgs<T> = Args<T>;

interface IDecryptPrompt {
	from: string;
	passphrase: string;
}

interface IGasPrompt {
	gas: number;
	gasPrice: string;
}

abstract class TxCommand<
	T extends IArgs<ITxOptions> = IArgs<ITxOptions>,
	TConsensus extends IAbstractConsensus = Solo
> extends Command<T, TConsensus> {
	protected transfer?: boolean;
	protected payable?: boolean;
	protected constant?: boolean;

	constructor(session: Session, args: T) {
		super(session, args);
	}

	protected async promptQueue(): Promise<void> {
		if (this.payable) {
			await this.decryptPrompt();
		}

		await this.prompt();

		if (this.payable || this.constant) {
			await this.gasPrompt();
		}
	}

	protected async gasPrompt() {
		if (!this.node) {
			throw Error('No node assigned');
		}

		const info = await this.node.getInfo<any>();
		const curr = new Currency(parseInt(info.min_gas_price, 10));

		this.args.options.gasPrice = curr.format('a').slice(0, -1);

		if (this.transfer) {
			this.args.options.gas = 21000;
			return;
		}

		if (this.constant) {
			this.args.options.gas = this.config.defaults.gas || 1000000000;
			return;
		}

		const questions: Inquirer.QuestionCollection<IGasPrompt> = [
			{
				message: 'Gas: ',
				name: 'gas',
				type: 'number',
				default: this.config.defaults.gas
			}
		];

		const answers = await Inquirer.prompt<IGasPrompt>(questions);

		this.args.options.gas = answers.gas;
		return;
	}

	protected async decryptPrompt() {
		const keystore = await this.datadir.listKeyfiles();

		if (!this.node) {
			throw Error('No node assigned to command');
		}

		// check connection
		await this.node.getInfo();

		// fetch account balances
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

		const defaultAccount =
			accounts.filter(
				(a: any) =>
					a.moniker.toLowerCase() ===
					this.config.defaults.from.toLowerCase()
			)[0] || undefined;

		const questions: Inquirer.QuestionCollection<IDecryptPrompt> = [
			{
				choices: accounts.map(
					(acc: any) => `${acc.moniker} (${acc.balance.format('T')})`
				),
				message: 'From: ',
				name: 'from',
				type: 'list'
			},
			{
				message: 'Passphrase: ',
				name: 'passphrase',
				type: 'password'
			}
		];

		if (defaultAccount) {
			// @ts-ignore
			const fromQ: any = questions[0];

			fromQ.default = `${
				defaultAccount.moniker
			} (${defaultAccount.balance.format('T')})`;
		}

		const answers = await Inquirer.prompt<IDecryptPrompt>(questions);

		this.startSpinner('Decrypting...');

		const from = answers.from.split(' ')[0];
		if (!from) {
			throw Error('`from` moniker not provided.');
		}

		if (!answers.passphrase) {
			throw Error('Passphrase not provided.');
		}

		const keyfile = await this.datadir.getKeyfile(from);

		this.account = Datadir.decrypt(keyfile, answers.passphrase.trim());

		this.stopSpinner();
	}
}

export default TxCommand;

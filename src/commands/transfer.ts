import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

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
	protected async init(): Promise<boolean> {
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		if (this.args.options.gas < 0 || !this.args.options.gas) {
			this.args.options.gas = this.config.defaults.gas;
		}

		if (this.args.options.gasprice < 0 || !this.args.options.gasprice) {
			this.args.options.gasprice = this.config.defaults.gasPrice;
		}

		this.args.options.from = this.args.options.from;

		return this.args.options.interactive;
	}

	protected async interactive(): Promise<void> {
		const first: inquirer.Questions<FirstAnswers> = [
			{
				choices: accounts.map(
					(acc: any) => `${acc.moniker} (${acc.balance.format('T')})`
				),
				message: 'From: ',
				name: 'from',
				type: 'list'
			}
		];

		const second: inquirer.Questions<SecondAnswers> = [
			{
				message: 'Enter password: ',
				name: 'passphrase',
				type: 'password'
			}
		];

		const third: inquirer.Questions<ThirdAnswers> = [
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
				default: config.defaults.gas || 100000,
				message: 'Gas: ',
				name: 'gas',
				type: 'number'
			},
			{
				default: config.defaults.gasPrice || 0,
				message: 'Gas Price: ',
				name: 'gasPrice',
				type: 'number'
			}
		];

		const fourth: inquirer.Questions<FourthAnswers> = [
			{
				message: 'Submit transaction',
				name: 'send',
				type: 'confirm'
			}
		];
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<void> {
		process.stdout.write('\u001B[2J\u001B[0;0f');
	}
}

export const Transfer = TransferCommand;

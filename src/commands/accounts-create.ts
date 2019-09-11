import Vorpal from 'vorpal';

import Command, { TArgs, TOptions } from '../core/Command';
import Session from '../core/Session';

interface Options extends TOptions {
	interactive?: boolean;
	debug?: boolean;
	pwd?: string;
	out?: string;
}

interface Args extends TArgs<Options> {
	moniker?: string;
	options: Options;
}

const command = (evmlc: Vorpal, session: Session): Command => {
	const description = 'Creates an encrypted keypair locally';

	return evmlc
		.command('accounts create [moniker]')
		.alias('a c')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-d, --debug', 'show debug output')
		.option('--pwd <file_path>', 'passphrase file path')
		.option('--out <output_path>', 'write keystore to output path')
		.types({
			string: ['_', 'pwd', 'out']
		})
		.action((args: Args) => new AccountCreateCommand(session, args).run());
};

class AccountCreateCommand extends Command<Args> {
	public async init(): Promise<boolean> {
		return true;
	}

	public async exec(): Promise<void> {
		console.log(this.session.datadir.configToml);
	}
}

export const AccountCreate = AccountCreateCommand;

export default command;

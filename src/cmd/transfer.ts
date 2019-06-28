// import * as inquirer from 'inquirer';

// import Vorpal, { Command, Args } from 'vorpal';

// import Session from '../Session';
// import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

// interface Options extends GenericOptions {}

// export interface Arguments extends Args<Options> {
// 	options: Options;
// }

// export default function command(evmlc: Vorpal, session: Session): Command {
// 	const description =
// 		'Initiate a transfer of token(s) to an address. ' +
// 		'Default values for gas and gas prices are set in the' +
// 		' configuration file.';

// 	return evmlc
// 		.command('transfer')
// 		.alias('t')
// 		.description(description)
// 		.option('-i, --interactive', 'enter interactive mode')
// 		.option('-d, --debug', 'show debug output')
// 		.option('-v, --value <value>', 'value to send')
// 		.option('-g, --gas <value>', 'gas')
// 		.option('-gp, --gasprice <value>', 'gas price')
// 		.option('-t, --to <address>', 'send to address')
// 		.option('-f, --from <address>', 'send from address')
// 		.option('--pwd <password>', 'passphrase file path')
// 		.option('-h, --host <ip>', 'override config host value')
// 		.option('-p, --port <port>', 'override config port value')
// 		.types({
// 			string: ['t', 'to', 'f', 'from', 'h', 'host', 'pwd']
// 		})
// 		.action(
// 			(args: Arguments): Promise<void> => execute(stage, args, session)
// 		);
// }

// export const stage: StagingFunction<Arguments, string, string> = async (
// 	args: Arguments,
// 	session: Session
// ) => {
// 	// const staging = new Staging<Arguments, string, string>(args);
// };

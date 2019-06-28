// import * as inquirer from 'inquirer';

// import Vorpal, { Command, Args } from 'vorpal';

// import Session from '../Session';
// import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

// interface Options extends GenericOptions {}

// export interface Arguments extends Args<Options> {
// 	options: Options;
// }

// export default function command(evmlc: Vorpal, session: Session): Command {
// 	const description = 'Creates an encrypted keypair locally.';

// 	return evmlc
// 		.command('accounts create')
// 		.alias('a c')
// 		.description(description)
// 		.option('-i, --interactive', 'interactive mode')
// 		.option('-d, --debug', 'show debug output')
// 		.option('--pwd <file_path>', 'password file path')
// 		.option('--out <output_path>', 'write keystore to output path')
// 		.types({
// 			string: ['pwd', 'out']
// 		})
// 		.action((args: Arguments) => execute(stage, args, session));
// }

// export const stage: StagingFunction<Arguments, any, any> = async (
// 	args: Arguments,
// 	session: Session
// ) => {};

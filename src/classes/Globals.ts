import * as Chalk from 'chalk';
import * as path from 'path';

export default class Globals {
	public static evmlcDir: string = path.join(
		require('os').homedir(),
		'.evmlc'
	);

	public static success(message: any): void {
		console.log(Chalk.default.green(message));
	}

	public static warning(message: any): void {
		console.log(Chalk.default.yellow(message));
	}

	public static error(message: any): void {
		console.log(Chalk.default.red(message));
	}

	public static info(message: any): void {
		console.log(Chalk.default.blue(message));
	}
}

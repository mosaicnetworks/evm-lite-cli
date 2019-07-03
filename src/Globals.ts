import * as Chalk from 'chalk';
import * as path from 'path';

export default class Globals {
	public static evmlcDir: string = path.join(
		require('os').homedir(),
		'.evmlc'
	);

	public static purple(message: string): void {
		console.log(Chalk.default.bgMagenta(message));
	}

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

	public static hexToString(hex: string) {
		let data = '';

		if (!hex) {
			return '';
		}

		for (let i = 0; i < hex.length; i += 2) {
			data += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
		}

		return data;
	}
}

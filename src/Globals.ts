import * as Chalk from 'chalk';

export default class Globals {
	public static purple(message: string): void {
		console.log(Chalk.default.magenta(message));
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
}

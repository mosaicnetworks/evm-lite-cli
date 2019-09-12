import * as Chalk from 'chalk';

export default class Globals {
	public static purple(message: string): void {
		console.log(Chalk.default.magenta(message));
	}

	public static green(message: any): void {
		console.log(Chalk.default.green(message));
	}

	public static yellow(message: any): void {
		console.log(Chalk.default.yellow(message));
	}

	public static red(message: any): void {
		console.log(Chalk.default.red(message));
	}

	public static blue(message: any): void {
		console.log(Chalk.default.blue(message));
	}
}

# Adding Commands

Depending on the type of command you can create them using two classes. The main class is `Command` which will allow you to create any generic command but if you require interactive prompts for decryption and gas price as the command is transactional in manner then you will need to use `TxCommand` class.

For example say we wanted to write a command to ping an endpoint and get results like the `info` command.

You will need to first import the required classes and types

```typescript
import Vorpal from 'vorpal';

import Node from 'evm-lite-core';

import Session from '../core/Session';
import Table from '../core/Table';

import Command, { Arguments, Options } from '../core/Command';
```

Then we will need to define a function to return a vorpal command object, making sure that it is the default export of the file.

```typescript
// Options for the command
type Opts = Options & {
	host: string;
	port: number;
};

// Inline arguments of the command
export type Args = Arguments<Opts> & {};

// Vorpal command instance factory function
export default (evmlc: Vorpal, session: Session) => {
	return evmlc
		.command('info')
		.description('Display information about node')
		.option('-h, --host <ip>', 'override config parameter host')
		.option('-p, --port <port>', 'override config parameter port')
		.types({
			string: ['h', 'host']
		})
		.action((args: Args) => new InfoCommand(session, args).run());
};
```

Then we will need to define each part of the abstract `Command` class, for example:

```typescript
class InfoCommand extends Command<Args> {
	// Here you will initialize any default variables as well as
	// instantiating the node object. The return of this function should be a
	// boolean indicating whether the command is interactive
	protected async init(): Promise<boolean> {
		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		this.node = new Node(this.args.options.host, this.args.options.port);

		return false;
	}

	// Any interactive prompts you will like to display
	protected async prompt(): Promise<void> {
		return;
	}

	// Argument checks and parsing should be done here
	protected async check(): Promise<void> {
		return;
	}

	// Actual execution of the command using the parsed arguments
	protected async exec(): Promise<string> {
		this.log.http(
			'GET',
			`${this.args.options.host}:${this.args.options.port}/info`
		);

		const info = await this.node!.getInfo();
		const table = new Table([], true, 'green');

		for (const key of Object.keys(info)) {
			table.push({
				// @ts-ignore
				[key]: info[key]
			});
		}

		return table.toString();
	}
}

export const Info = InfoCommand;
```

import { ILog } from 'evm-lite-client';

class Logs {
	constructor(public readonly logs: ILog[]) {}

	public filter<E>(event: string): E[] {
		const logs = this.logs.filter(
			e => event.toLowerCase() === e.event!.toLowerCase()
		);

		if (!logs.length) {
			return [];
		}

		return logs.map(l => l.args) as E[];
	}

	public find<E>(event: string): E | undefined {
		const log = this.logs.find(
			e => event.toLowerCase() === e.event!.toLowerCase()
		);

		if (!log) {
			return undefined;
		}

		return log.args as E;
	}
}

export default Logs;

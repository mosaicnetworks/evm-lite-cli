import * as p from 'path';

import Datadir from 'evm-lite-datadir';
import Keystore from 'evm-lite-keystore';

export default class Session {
	public name: string = 'evmlc';
	public interactive: boolean = false;
	public debug: boolean = false;

	public readonly datadir: Datadir<Keystore>;

	constructor(datadir: string, config: string) {
		const k = new Keystore(p.join(datadir, 'keystore'));

		this.name = config;

		this.datadir = new Datadir(datadir, config, k);
	}
}

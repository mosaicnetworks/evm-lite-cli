import * as p from 'path';

import Datadir from 'evm-lite-datadir';
import Keystore from 'evm-lite-keystore';

export default class Session {
	public name: string = 'evmlc';
	public interactive: boolean = false;
	public debug: boolean = false;

	public datadir: Datadir<Keystore>;

	constructor(datadir: string, public readonly config: string) {
		this.name = config;

		const k = new Keystore(p.join(datadir, 'keystore'));
		this.datadir = new Datadir(datadir, this.config, k);
	}

	public setDatadir(path: string) {
		const k = new Keystore(p.join(path, 'keystore'));
		this.datadir = new Datadir(path, this.config, k);
	}
}

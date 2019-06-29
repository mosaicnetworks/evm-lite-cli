import ASCIITable from 'ascii-table';

import { Arguments, stage } from '../src/cmd/accounts-get';
import { InvalidArgumentError, InvalidConnection } from '../src/errors';

import { session } from './stage';
import { BaseAccount, Utils } from 'evm-lite-core';

describe('accounts-get.ts', () => {
	it('should throw InvalidConnetionError', async () => {
		const args: Arguments = {
			address: '0x989beF689410f079D10b560C64c69aa5b557b105',
			options: {
				host: '127.0.0.1',
				port: 3000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidConnection).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (no arguments)', async () => {
		const args: Arguments = {
			address: '',
			options: {
				host: '127.0.0.1',
				port: 8080
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((inc 0x) longer `address`)', async () => {
		const args: Arguments = {
			address: '0x989beF689410f079D10b560C64c69aa5b557b1057',
			options: {
				host: '127.0.0.1',
				port: 8080
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((inc 0x) shorter `address`)', async () => {
		const args: Arguments = {
			address: '0x989beF689410f079D10b560C64c69aa5b557b10',
			options: {
				host: '127.0.0.1',
				port: 8080
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((ex 0x) longer `address`)', async () => {
		const args: Arguments = {
			address: '989beF689410f079D10b560C64c69aa5b557b1059',
			options: {
				host: '127.0.0.1',
				port: 8080
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((ex 0x) shorter `address`)', async () => {
		const args: Arguments = {
			address: '989beF689410f079D10b560C64c69aa5b557b10',
			options: {
				host: '127.0.0.1',
				port: 8080
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((mul 0x) shorter `address`)', async () => {
		const args: Arguments = {
			address: '0x0x989beF689410f079D10b560C64c69aa5b557b1', // length 42
			options: {
				host: '127.0.0.1',
				port: 8080
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should fetch account with non-formatted output', async () => {
		const address = '0x989beF689410f079D10b560C64c69aa5b557b105';

		const args: Arguments = {
			address,
			options: {
				host: '127.0.0.1',
				port: 8080
			}
		};

		const output = await stage(args, session);
		const account = output.display as BaseAccount;

		expect(args.address).toBe(address.slice(2));
		expect(Utils.trimHex(account.address)).toBe(Utils.trimHex(address));
		expect(account.balance).not.toBe(undefined);
		expect(account.nonce).not.toBe(undefined);
		expect(account.bytecode).not.toBe(undefined);
	});

	it('should fetch account with formatted output', async () => {
		const address = '0x989beF689410f079D10b560C64c69aa5b557b105';

		const args: Arguments = {
			address,
			options: {
				formatted: true,
				host: '127.0.0.1',
				port: 8080
			}
		};

		const output = await stage(args, session);

		expect(output.display instanceof ASCIITable).toBe(true);
	});
});

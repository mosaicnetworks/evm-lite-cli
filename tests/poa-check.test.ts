import { stage, Arguments } from '../src/cmd/poa-check';
import {
	InvalidConnectionError,
	EmptyKeystoreDirectoryError,
	InvalidArgumentError
} from '../src/errors';

import { session, clearKeystore } from './stage';

describe('poa-check.ts', () => {
	it('should throw InvalidConnetionError', async () => {
		const args: Arguments = {
			options: {
				host: '127.0.0.1',
				port: 3000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidConnectionError).toBe(true);
		}
	});

	it('should throw EmptyKeystoreDirectoryError', async () => {
		clearKeystore();

		const args: Arguments = {
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof EmptyKeystoreDirectoryError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((inc 0x) long address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: keystore.address + '0', // 43
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((inc 0x) short address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: `0x${keystore.address.slice(3)}`, // 41
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((ex 0x) long address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: keystore.address.slice(2) + '0', // 41
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((inc 0x) short address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: `${keystore.address.slice(3)}`, // 39
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((mul 0x) address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: `0x0x${keystore.address.slice(4)}`, // 42
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (no `from` address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: keystore.address, // 42
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});
});

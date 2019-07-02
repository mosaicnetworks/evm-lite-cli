import { session, password, pwdPath, otherPwdPath } from './stage';

import { stage, Arguments, Output } from '../src/cmd/poa-nominate';
import { INVALID_CONNECTION, KEYSTORE } from '../src/errors/generals';
import { POA_NOMINATE } from '../src/errors/poa';

describe('poa-nominate.ts', () => {
	it('should error as invalid node conn details', async () => {
		expect.assertions(3);

		const args: Arguments = {
			options: {
				host: '127.0.0.1',
				port: 3000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(3000);

			if (output.error) {
				expect(output.error.type).toBe(INVALID_CONNECTION);
			}
		}
	});

	it('should error as empty keystore', async () => {
		expect.assertions(1);

		const args: Arguments = {
			options: {
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			if (output.error) {
				expect(output.error.type).toBe(KEYSTORE.EMPTY);
			}
		}
	});

	it('should error as empty [address] provided', async () => {
		expect.assertions(1);

		// create keystore
		await session.keystore.create(password);

		const args: Arguments = {
			options: {
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			if (output.error) {
				expect(output.error.type).toBe(POA_NOMINATE.ADDRESS_EMPTY);
			}
		}
	});

	it('should error as empty --moniker provided', async () => {
		expect.assertions(1);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			if (output.error) {
				expect(output.error.type).toBe(POA_NOMINATE.MONIKER_EMPTY);
			}
		}
	});

	it('should error as [address] is too short', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address.slice(3),
			options: {
				moniker: 'test',
				host: '127.0.0.1',
				port: 8080
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8080);

			if (output.error) {
				expect(output.error.type).toBe(
					POA_NOMINATE.ADDRESS_INVALID_LENGTH
				);
			}
		}
	});

	it('should error as [address] is too long', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: `${keystore.address}F`,
			options: {
				moniker: 'test',
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);

			if (output.error) {
				expect(output.error.type).toBe(
					POA_NOMINATE.ADDRESS_INVALID_LENGTH
				);
			}
		}
	});

	it('should error as --from address is empty', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				moniker: 'test',
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);

			if (output.error) {
				expect(output.error.type).toBe(POA_NOMINATE.FROM_EMPTY);
			}
		}
	});

	it('should error as --from address too long', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				from: keystore.address + 'F',
				moniker: 'test',
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);

			if (output.error) {
				expect(output.error.type).toBe(
					POA_NOMINATE.FROM_INVALID_LENGTH
				);
			}
		}
	});

	it('should error as --from address too short', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				from: keystore.address.slice(3),
				moniker: 'test',
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);

			if (output.error) {
				expect(output.error.type).toBe(
					POA_NOMINATE.FROM_INVALID_LENGTH
				);
			}
		}
	});

	it('should error as --pwd path empty', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				from: keystore.address,
				moniker: 'test',
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);

			if (output.error) {
				expect(output.error.type).toBe(POA_NOMINATE.PWD_PATH_EMPTY);
			}
		}
	});

	it('should error as --pwd path does not exist', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				from: keystore.address,
				pwd: '/does_not_exist/pwd.txt',
				moniker: 'test',
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);

			if (output.error) {
				expect(output.error.type).toBe(POA_NOMINATE.PWD_PATH_NOT_FOUND);
			}
		}
	});

	it('should error as --pwd path is dir', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				from: keystore.address,
				pwd: '/',
				moniker: 'test',
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);

			if (output.error) {
				expect(output.error.type).toBe(POA_NOMINATE.PWD_IS_DIR);
			}
		}
	});

	it('should error as --from address keystore not found', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				from: keystore.address.slice(1) + '0',
				pwd: pwdPath,
				moniker: 'test',
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);

			if (output.error) {
				expect(output.error.type).toBe(KEYSTORE.FETCH);
			}
		}
	});

	it('should error as could not decrypt --from with --pwd', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				from: keystore.address,
				pwd: otherPwdPath,
				moniker: 'test',
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);

			if (output.error) {
				expect(output.error.type).toBe(KEYSTORE.DECRYPTION);
			}
		}
	});
});

import Utils from 'evm-lite-utils';

import { session, password, pwdPath, otherPwdPath } from './stage';

import { Arguments, stage, Output } from '../src/cmd/accounts-update';
import { KEYSTORE } from '../src/errors/generals';
import { ACCOUNTS_UPDATE } from '../src/errors/accounts';
import { V3JSONKeyStore } from 'evm-lite-keystore';

describe('accounts-update.ts', () => {
	it('should error as empty keystore', async () => {
		expect.assertions(1);

		const args: Arguments = {
			options: {}
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

	it('should error as no [address] was provided', async () => {
		expect.assertions(2);

		// create keystore
		await session.keystore.create(pwdPath);

		const args: Arguments = {
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.address).toBe(undefined);

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.ADDRESS_EMPTY);
			}
		}
	});

	it('should error as shorter [address] was provided', async () => {
		expect.assertions(2);

		// create keystore
		const keystore = await session.keystore.create(pwdPath);

		const args: Arguments = {
			address: keystore.address.slice(3),
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.address).toBe(
				Utils.trimHex(keystore.address.slice(3))
			);

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_UPDATE.ADDRESS_INVALID_LENGTH
				);
			}
		}
	});

	it('should error as longer [address] was provided', async () => {
		expect.assertions(2);

		// create keystore
		const keystore = await session.keystore.create(pwdPath);

		const args: Arguments = {
			address: `${keystore.address}FA`,
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.address).toBe(
				Utils.trimHex(`${keystore.address}FA`)
			);

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_UPDATE.ADDRESS_INVALID_LENGTH
				);
			}
		}
	});

	it('should error as [address] provided does not exist', async () => {
		expect.assertions(2);

		// create keystore
		const keystore = await session.keystore.create(pwdPath);

		const args: Arguments = {
			address: `${keystore.address.slice(1)}F`,
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.address).toBe(
				Utils.trimHex(`${keystore.address.slice(1)}F`)
			);

			if (output.error) {
				expect(output.error.type).toBe(KEYSTORE.FETCH);
			}
		}
	});

	it('should error as --old passphrase path empty', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(pwdPath);

		const args: Arguments = {
			address: keystore.address,
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe(undefined);
			expect(output.args.address).toBe(Utils.trimHex(keystore.address));

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.OLD_PWD_EMPTY);
			}
		}
	});

	it('should error as --old passphrase path cannot be found', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(pwdPath);

		const args: Arguments = {
			address: keystore.address,
			options: {
				old: '/does_not_exists/pwd.txt'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe('/does_not_exists/pwd.txt');
			expect(output.args.address).toBe(Utils.trimHex(keystore.address));

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_UPDATE.OLD_PWD_NOT_FOUND
				);
			}
		}
	});

	it('should error as --old passphrase path is dir', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(pwdPath);

		const args: Arguments = {
			address: keystore.address,
			options: {
				old: '/'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe('/');
			expect(output.args.address).toBe(Utils.trimHex(keystore.address));

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.OLD_PWD_IS_DIR);
			}
		}
	});

	it('should error as --old passphrase is incorrect to decrypt', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.keystore.create(pwdPath);

		const args: Arguments = {
			address: keystore.address,
			options: {
				old: otherPwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe(otherPwdPath);
			expect(output.args.address).toBe(Utils.trimHex(keystore.address));

			if (output.error) {
				expect(output.error.type).toBe(KEYSTORE.DECRYPTION);
			}
		}
	});

	it('should error as --new passphrase path empty', async () => {
		expect.assertions(4);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				old: pwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe(pwdPath);
			expect(output.args.options.new).toBe(undefined);
			expect(output.args.address).toBe(Utils.trimHex(keystore.address));

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.NEW_PWD_EMPTY);
			}
		}
	});

	it('should error as --new passphrase path cannot be found', async () => {
		expect.assertions(4);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				old: pwdPath,
				new: '/does_not_exist/pwd.txt'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe(pwdPath);
			expect(output.args.options.new).toBe('/does_not_exist/pwd.txt');
			expect(output.args.address).toBe(Utils.trimHex(keystore.address));

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_UPDATE.NEW_PWD_NOT_FOUND
				);
			}
		}
	});

	it('should error as --new passphrase path is dir', async () => {
		expect.assertions(4);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				old: pwdPath,
				new: '/'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe(pwdPath);
			expect(output.args.options.new).toBe('/');
			expect(output.args.address).toBe(Utils.trimHex(keystore.address));

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.NEW_PWD_IS_DIR);
			}
		}
	});

	it('should error as --new and --old passphrases are the same', async () => {
		expect.assertions(4);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				old: pwdPath,
				new: pwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			// implicit check that they are the same
			expect(output.args.options.old).toBe(pwdPath);
			expect(output.args.options.new).toBe(pwdPath);

			expect(output.args.address).toBe(Utils.trimHex(keystore.address));

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_UPDATE.SAME_OLD_NEW_PWD
				);
			}
		}
	});

	it('should change password to --new passphrase', async () => {
		expect.assertions(4);

		// create keystore
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address,
			options: {
				old: pwdPath,
				new: otherPwdPath
			}
		};

		const output = await stage(args, session);
		const success = output.display! as V3JSONKeyStore;

		// implicit check that they are the same
		expect(output.args.options.old).toBe(pwdPath);
		expect(output.args.options.new).toBe(otherPwdPath);

		expect(output.args.address).toBe(Utils.trimHex(keystore.address));
		expect(Utils.trimHex(success.address)).toBe(
			Utils.trimHex(keystore.address)
		);
	});
});

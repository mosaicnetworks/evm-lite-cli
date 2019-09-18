import { AccountCreate } from '../src/commands/accounts-create';

import { session } from './resources/';

describe('accounts create', () => {
	it('should throw moniker not found error', async () => {
		const cmd = new AccountCreate(session, {
			moniker: '',
			options: {
				out: session.datadir.keystorePath,
				silent: false
			}
		});

		try {
			await cmd.check();
		} catch (e) {
			expect(e.message).toBe('Moniker cannot be empty');
		}
	});

	it('should throw invalid characters in moniker error', async () => {
		const cmd = new AccountCreate(session, {
			moniker: 'asd-123',
			options: {
				out: session.datadir.keystorePath,
				silent: false
			}
		});

		try {
			await cmd.check();
		} catch (e) {
			expect(e.message).toBe('Moniker contains illegal characters');
		}
	});

	it('should throw --pwd path not provided error', async () => {
		const cmd = new AccountCreate(session, {
			moniker: 'test',
			options: {
				out: session.datadir.keystorePath,
				silent: false
			}
		});

		try {
			await cmd.check();
		} catch (e) {
			expect(e.message).toBe('No passphrase file path provided');
		}
	});

	it('should throw --pwd path does not exist error', async () => {
		const cmd = new AccountCreate(session, {
			moniker: 'test',
			options: {
				pwd: '/does_not_exist/',
				out: session.datadir.keystorePath,
				silent: false
			}
		});

		try {
			await cmd.check();
		} catch (e) {
			expect(e.message).toBe(
				'Passphrase file path provided does not exist'
			);
		}
	});

	it('should throw --pwd path is directory error', async () => {
		const cmd = new AccountCreate(session, {
			moniker: 'test',
			options: {
				pwd: '/',
				out: session.datadir.keystorePath,
				silent: false
			}
		});

		try {
			await cmd.check();
		} catch (e) {
			expect(e.message).toBe(
				'Passphrase file path provided is a directory'
			);
		}
	});

	it('should throw --out path does not exist error', async () => {
		const cmd = new AccountCreate(session, {
			moniker: 'test',
			options: {
				pwd: './__tests__/resources/pwd.txt',
				out: '/path_does_not/exist/',
				silent: false
			}
		});

		try {
			await cmd.check();
		} catch (e) {
			expect(e.message).toBe('Output path provided does not exist');
		}
	});

	it('should throw --out path is not directory error', async () => {
		const cmd = new AccountCreate(session, {
			moniker: 'test',
			options: {
				pwd: './__tests__/resources/pwd.txt',
				out: './__tests__/resources/pwd.txt',
				silent: false
			}
		});

		try {
			await cmd.check();
		} catch (e) {
			expect(e.message).toBe('Output path provided is a not a directory');
		}
	});
});

import { resolve } from 'path';

import execa from 'execa';

import color from '../src/core/color';

const log = color.green;
const out = color.yellow;
const pwdpath = resolve(__dirname, './pwd.txt');
const otherAddress = '0xf17e6A3D50BdC342FbeBa0EE3322d50c250cE982';

const cli = async (cmd: string) => {
	const { stdout, stderr } = await execa('ts-node', [
		resolve(__dirname, '../src/evmlc.ts'),
		'--datadir',
		resolve(__dirname, './datadir'),
		cmd
	]);

	if (stderr && !stdout) {
		return Promise.reject(stderr);
	}

	return stdout;
};

(async () => {
	log('Initiating POA Contract...');
	out(await cli(`poa init --pwd ${pwdpath}`));

	log('Showing current whitelist...');
	out(await cli('poa whitelist -f'));

	log('Nominating `other`...');
	out(
		await cli(
			`poa nominate ${otherAddress} --moniker other --pwd ${pwdpath} --from e2e`
		)
	);

	log('Showing current whitelist...');
	out(await cli('poa whitelist -f'));

	log('Evicting second whitelisted address');
	out(await cli(`poa evict ${otherAddress} --pwd ${pwdpath} --from e2e`));

	log('Showing current whitelist...');
	out(await cli('poa whitelist -f'));
})().catch(color.red);

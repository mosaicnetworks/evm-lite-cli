import { dirname } from 'path';
import { fileURLToPath } from 'url';

import load from 'edit-json-file';

const __dirname = dirname(fileURLToPath(import.meta.url));

let file = load(`${__dirname}/../package.json`);

file.unset('bin');
file.set('bin', {
	monet: './dist/index.js'
});

file.save();

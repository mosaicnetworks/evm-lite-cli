# Frame

Abstract out the common tasks in a command and provide a clean way of revieving variables and errors from those tasks.

```typescript
// import from some hypothetical library
import { listKeystores } from 'evm-lite-cli/frames';

const [keyfiles, error] = listKeystores<TKeyfiles>('PATH_HERE');
if (error) {
	// do some error handling here.
}
```

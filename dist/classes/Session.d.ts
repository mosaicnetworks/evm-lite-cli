import { DataDirectory, EVMLC } from 'evm-lite-lib';
export default class Session {
    interactive: boolean;
    logpath: string;
    directory: DataDirectory;
    connection: EVMLC;
    constructor(dataDirPath: string);
    readonly database: import("evm-lite-lib/dist/tools/classes/database/Database").default;
    readonly keystore: import("evm-lite-lib/dist/tools/classes/Keystore").default;
    readonly config: import("evm-lite-lib/dist/tools/classes/Config").default;
    connect(forcedHost: string, forcedPort: number): Promise<EVMLC>;
}

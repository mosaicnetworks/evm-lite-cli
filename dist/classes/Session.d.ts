import { DataDirectory, EVMLC } from 'evm-lite-lib';
export default class Session {
    interactive: boolean;
    logpath: string;
    directory: DataDirectory;
    connection: EVMLC;
    constructor(dataDirPath: string);
    readonly database: import("evm-lite-lib").Database;
    readonly keystore: import("evm-lite-lib").Keystore;
    readonly config: import("evm-lite-lib").Config;
    connect(forcedHost: string, forcedPort: number): Promise<EVMLC>;
}

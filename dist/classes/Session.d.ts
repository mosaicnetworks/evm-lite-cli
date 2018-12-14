import { Config, Database, DataDirectory, EVMLC, Keystore, Log } from 'evm-lite-lib';
export default class Session {
    interactive: boolean;
    logpath: string;
    directory: DataDirectory;
    connection: EVMLC;
    keystore: Keystore;
    config: Config;
    database: Database;
    logs: Log[];
    constructor(dataDirPath: string);
    connect(forcedHost: string, forcedPort: number): Promise<EVMLC>;
    log(): Log;
}

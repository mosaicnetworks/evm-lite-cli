import { Config, Controller, Database, DataDirectory, Keystore, Log } from 'evm-lite-lib';
export default class Session {
    interactive: boolean;
    logpath: string;
    directory: DataDirectory;
    connection: Controller;
    keystore: Keystore;
    config: Config;
    database: Database;
    logs: Log[];
    constructor(dataDirPath: string);
    connect(forcedHost: string, forcedPort: number): Promise<Controller>;
    log(): Log;
}

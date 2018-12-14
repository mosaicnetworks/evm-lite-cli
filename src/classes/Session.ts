import * as path from "path";

import {Config, Database, DataDirectory, EVMLC, Keystore, Log} from 'evm-lite-lib';


export default class Session {

    public interactive: boolean;
    public logpath: string;

    public directory: DataDirectory;
    public connection: EVMLC;
    public keystore: Keystore;
    public config: Config;
    public database: Database;
    public logs: Log[];


    constructor(dataDirPath: string) {
        this.interactive = false;
        this.connection = null;
        this.logs = [];

        this.logpath = path.join(dataDirPath, 'logs');

        this.directory = new DataDirectory(dataDirPath);
        this.database = new Database(path.join(dataDirPath, 'db.json'));

        this.config = this.directory.config;
        this.keystore = this.directory.keystore;
    }

    public connect(forcedHost: string, forcedPort: number): Promise<EVMLC> {
        const host: string = forcedHost || this.config.data.defaults.host || '127.0.0.1';
        const port: number = forcedPort || this.config.data.defaults.port || 8080;
        const node = new EVMLC(host, port, {
            from: '',
            gas: 0,
            gasPrice: 0
        });

        return node.testConnection()
            .then((success: boolean) => {
                if (success) {
                    if (this.connection && this.connection.host === host && this.connection.port === port) {
                        return this.connection
                    }

                    if (!forcedHost && !forcedPort) {
                        this.connection = node;
                    }
                    return node;
                } else {
                    return null;
                }
            })
    };

    public log(): Log {
        const log = new Log(this.logpath);
        this.logs.push(log);
        return log;
    }

}
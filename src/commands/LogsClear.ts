import * as fs from "fs";
import * as Vorpal from "vorpal";

import Globals from "../classes/Globals";
import Session from "../classes/Session";


export default function commandLogsClear(evmlc: Vorpal, session: Session) {
    return evmlc.command('logs clear').alias('l c')
        .description('Clears log information.')
        .hidden()
        .action((args: Vorpal.Args): Promise<void> => {
            return new Promise<void>((resolve) => {
                fs.writeFileSync(session.logpath, '');
                Globals.success('Logs cleared.');
                resolve();
            });
        });
};


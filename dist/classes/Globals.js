"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Chalk = require("chalk");
const path = require("path");
class Globals {
    static success(message) {
        console.log(Chalk.default.green(message));
    }
    static warning(message) {
        console.log(Chalk.default.yellow(message));
    }
    static error(message) {
        console.log(Chalk.default.red(message));
    }
    static info(message) {
        console.log(Chalk.default.blue(message));
    }
}
Globals.evmlcDir = path.join(require('os').homedir(), '.evmlc');
exports.default = Globals;

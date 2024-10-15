"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Adapter = void 0;
const logger_1 = require("./logger");
class Adapter {
    constructor(logger) {
        if (!logger) {
            this.logger = new logger_1.DefaultLogger();
        }
        else {
            this.logger = logger;
        }
    }
}
exports.Adapter = Adapter;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heroku = void 0;
const vscode = __importStar(require("vscode"));
const helpers_1 = require("./helpers");
class Heroku {
    constructor() {
        this.teams = {};
        this.uri = 'https://api.heroku.com';
        this.token = '';
        const config = vscode.workspace.getConfiguration('herokudev');
        this.token = config.get('token');
    }
    apiFetch(feature, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            feature = (0, helpers_1.updateIDS)(feature, ids, '_id');
            let out = [];
            yield fetch(this.uri + feature, {
                method: 'GET',
                headers: {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    Authorization: 'Bearer ' + this.token,
                    Accept: 'application/vnd.heroku+json; version=3.monitoring-events',
                }
            })
                .then(response => response.json())
                .then(data => out = data);
            return out;
        });
    }
    ;
    apiPatch(feature, ids, data) {
        return __awaiter(this, void 0, void 0, function* () {
            feature = (0, helpers_1.updateIDS)(feature, ids, '_id');
            return fetch(this.uri + feature, {
                method: 'PATCH',
                headers: {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    'Authorization': 'Bearer ' + this.token,
                    'Accept': 'application/vnd.heroku+json; version=3.monitoring-events',
                },
                body: JSON.stringify(data)
            });
        });
    }
}
exports.Heroku = Heroku;
//# sourceMappingURL=Heroku.js.map
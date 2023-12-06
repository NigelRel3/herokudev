"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIDS = void 0;
// Replace any ID's in the baseString from stored values.
// Includes postfix if required.
// So  /apps/{app_id}/addons => /apps/d3fb5b43-7d30-4930-8584-af6724ecbf25/addons
function updateIDS(baseString, ids, postfix = '') {
    return baseString.replace(new RegExp(`\{(.+?)${postfix}\}`, 'g'), (m, label) => {
        return ids[label];
    });
}
exports.updateIDS = updateIDS;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
//# sourceMappingURL=helpers.js.map
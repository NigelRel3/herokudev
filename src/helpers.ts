// Replace any ID's in the baseString from stored values.
// Includes postfix if required.
// So  /apps/{app_id}/addons => /apps/d3fb5b43-7d30-4930-8584-af6724ecbf25/addons
export function updateIDS(baseString: string, ids: StringIndexed, postfix: string = '') {
    return baseString.replace(new RegExp(`\{(.+?)${postfix}\}`, 'g'), (m, label) => {
        return ids[label];
    });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

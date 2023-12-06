import * as vscode from 'vscode';
import { updateIDS } from './helpers';

export class Heroku {
    private teams: any = {};
    private uri: string = 'https://api.heroku.com';
    private token: string = '';

    constructor()
    {
        const config = vscode.workspace.getConfiguration('herokudev');
        this.token = config.get('token');
    }

    public async apiFetch(feature: string, ids: StringIndexed): Promise<StringIndexed>
    {
        feature = updateIDS(feature, ids, '_id');

        let out = [];
        await fetch(this.uri + feature, {
            method: 'GET',
            headers: {
                /* eslint-disable @typescript-eslint/naming-convention */
                Authorization: 'Bearer ' + this.token,
                Accept: 'application/vnd.heroku+json; version=3.monitoring-events',
                }
            }
        )
        .then(response => response.json())
        .then(data => out = data);

        return out;
    };

    public async apiPatch(feature: string, ids: StringIndexed, data: StringIndexed): Promise<StringIndexed> {
        feature = updateIDS(feature, ids, '_id');

        return fetch(this.uri + feature, {
            method: 'PATCH',
            headers: {
                /* eslint-disable @typescript-eslint/naming-convention */
                'Authorization': 'Bearer ' + this.token,
                'Accept': 'application/vnd.heroku+json; version=3.monitoring-events',
                },
            body: JSON.stringify(data)
            }
        );

    }
}

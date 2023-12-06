import axios from 'axios';
import { updateIDS } from '../../src/helpers';

export class Heroku {
    private uri: string = 'https://api.heroku.com';
    private token: string = '';

    constructor(token: any)
    {
        this.token = token;
    }

    public async apiFetch(feature: string, ids: string[]): Promise<StringIndexed>
    {
        feature = updateIDS(feature, ids, '_id');

        return axios.get(this.uri + feature, {
            headers: {
                /* eslint-disable @typescript-eslint/naming-convention */
                'Authorization': 'Bearer ' + this.token,
                'Accept': 'application/vnd.heroku+json; version=3.monitoring-events',
                }
            }
        );
    }

    public async apiPatch(feature: string, ids: StringIndexed, data: any): Promise<StringIndexed> {
        feature = updateIDS(feature, ids, '_id');

        return await axios.patch(this.uri + feature,
            data,
            {
                headers: {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    'Authorization': 'Bearer ' + this.token,
                    'Accept': 'application/vnd.heroku+json; version=3.monitoring-events',
                    'Content-Type': 'application/json',
                }
            }
        );
    }

    public async apiPut(feature: string, ids: StringIndexed, data: any): Promise<StringIndexed> {
        feature = updateIDS(feature, ids, '_id');

        return await axios.put(this.uri + feature,
            data,
            {
                headers: {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    'Authorization': 'Bearer ' + this.token,
                    'Accept': 'application/vnd.heroku+json; version=3.monitoring-events',
                    'Content-Type': 'application/json',
                }
            }
        );
    }

}


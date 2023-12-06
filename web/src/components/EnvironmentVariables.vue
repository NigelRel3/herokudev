<template>
    <h1>Environment Variables</h1>

    <div class="env-table">
        <div class="env-row env-header">
            <div class="variable_name">Name</div>
            <div class="variable_value">Value</div>
            <div class="head_selector">Editable</div>
        </div>
        <div v-for="(value, key) in settings" 
                :key="key"
                class="env-row"
                >
            <div class="variable_name">
                <input type="text" 
                    v-model="settings[key].key" 
                    :disabled="!settings[key].newValue"
                    @change="flagChanged(key)"
                    />
            </div>
            <div class="variable_value">
                <input type="text" 
                    v-model="settings[key].value" 
                    :disabled="!settings[key].editable"
                    @change="flagChanged(key)"
                    />
            </div>
            <div class="table_selector">
                <input type="checkbox"
                    v-model="settings[key].editable"
                    />
            </div>
        </div>
    </div>

    <input class="button"
        type="button"
        @click="addNewVariable()"
        value="Add new" 
        />

    <input class="button"
         type="button"
        :disabled="disableSave"
        @click="saveUpdates()"
        value="Save" 
        />

    <input class="button"
        type="button"
        @click="setSalts()"
        value="Set salts" 
        />


    <div>{{ message }}</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import { Heroku } from '../Heroku';
import { nanoid } from "nanoid";
</script>

<script lang="ts">
export default defineComponent({
    data(): {
        settings: {key: string, value: string, editable: boolean, newValue: boolean, modified: boolean}[],
        disableSave: boolean,
        selected: boolean,
        herokuInstance: Heroku | null,
        message: string,
    } {
        return {
            settings: [],
            disableSave: true,
            selected: false,
            herokuInstance: null,
            message: '',
        };
    },
    props: ['content', 'herokuConfig'],
    mounted() {
        const settings = JSON.parse(this.content);
        Object.keys(settings).forEach((key: string) =>    {
            this.settings.push({key: key, value: settings[key], editable: false, newValue: false, modified: false});
        })
        this.herokuInstance = new Heroku(this.herokuConfig.token);
    },

    methods: {
        addNewVariable()    {
            this.settings.push({key: '', value: '', editable: true, newValue: true, modified: true});
        },

        flagChanged(key: any)   {
            this.settings[key].modified = true;
            this.disableSave = false;
        },

        saveUpdates()   {
            let changes: any = {};
            this.settings.forEach((setting) => {
                if(setting.modified && setting.key)    {
                    changes[setting.key] = setting.value;
                    setting.modified = false;
                    setting.newValue = false;
                }
            });

            if (this.herokuInstance && Object.keys(changes).length > 0)    {
                this.message = 'Processing...';
                this.herokuInstance.apiPatch('/apps/{app_id}/config-vars', 
                        this.herokuConfig.node.ids, 
                        changes)
                .then(() => {
                    this.message = 'Variables updated!';
                    setTimeout(() => this.message = '' , 2000);
                });
                this.disableSave = true;
            }
        },

        setSalts()  {
            if (this.herokuInstance)    {
                const newVars = ['WP_AUTH_KEY', 'WP_AUTH_SALT', 'WP_LOGGED_IN_KEY', 'WP_LOGGED_IN_SALT', 
                        'WP_NONCE_KEY', 'WP_NONCE_SALT', 'WP_SECURE_AUTH_KEY', 'WP_SECURE_AUTH_SALT'];
                let newEnvVars : StringIndexed = {};
                newVars.forEach((name) => {
                    // Check if already set
                    if(this.settings.find((setting) => ((setting.key == name) == undefined) && setting.value))   {
                        const id = nanoid(40);
                        this.settings.push({key: name, value: id, editable: true, newValue: true, modified: true})
                        newEnvVars[name] = id;
                    }
                });
                this.message = 'Processing...';
                this.herokuInstance.apiPatch('/apps/{app_id}/config-vars',
                    this.herokuConfig.node.ids,
                    newEnvVars
                )
                .then(() => {
                    this.message = 'Variables updated!';
                    setTimeout(() => this.message = '' , 2000);
                });
            }
        }
    }
});
</script>

<style scoped>
.env-table {
    display: table;              
    border: 1px solid #666666; 
    width: 90%;
    max-width: 100em;
}
.env-row {
    display: table-row;
    width: 100%;
    clear: both;
}
.env-header {
    background-color: darkslategray;
    padding: 5px;
    text-align: center;
}
.variable_name {
    display: table-cell;
    width: 30%;
    padding: 5px;
    border: 1px solid;
}
.head_selector  {
    display: table-cell;
    width: 10%;
    border: 1px solid;
}
.variable_value  {
    display: table-cell;
    width: 60%;
    padding: 5px;
    border: 1px solid;
}

.table_selector {
    display: table-cell;
    width: 10%;
    background-color: rgb(70, 112, 112);
    padding: 5px;
    text-align: center;
    border: 1px solid;
}

input[type="text"]:disabled {
  background: #313030;
  color: white;
  width: 90%;
}

input[type="text"] {
  background: white;
  color: #313030;
  width: 90%;
}

.button:hover  {
    background-color: rgb(96, 165, 250);
}

.button:disabled  {
    background-color: rgb(75, 85, 99);
    color: black;
}

.button  {
    padding-left: 2rem;
    padding-right: 2rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-radius: 0.25rem;
    background-color: rgb(59, 130, 246);
    color: white;
}
</style>
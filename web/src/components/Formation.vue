<template>
    <h1>Formation</h1>

    <div class="env-table">
        <div class="env-row env-header">
                <div class="variable_name">Name</div>
                <div class="variable_name">Type</div>
                <div class="variable_name">Qty</div>
                <div class="variable_name">Size</div>
                <div class="variable_name"></div>
        </div>
        <div class="env-row" 
                v-for="(form, key) in formation" 
                :key="form.id"
                >
            <div class="variable_name">{{ form.app.name }}</div>
            <div class="variable_name">{{ form.type }}</div>
            <div class="variable_name">
                <input type="number"
                    v-model="formation[key].quantity" 
                    />
            </div>
            <div class="variable_name">
                <select v-model="formation[key].size">    
                    <option v-for="size in dynoSizes" v-bind:value="size.name">
                        {{ size.name }}
                    </option>
                </select>
            </div>
            <div><input class="button" type="button" @click="scale(key)" value="Apply" /></div>
        </div>
    </div>

    <div>{{ message }}</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import { Heroku } from '../Heroku';
</script>

<script lang="ts">
export default defineComponent({
    data(): {
        formation: any[],
        dynoSizes: any[],
        herokuInstance: Heroku | null,
        message: string,
    } {
        return {
            formation: [],
            dynoSizes: [],
            herokuInstance: null,
            message: '',
        };
    },
    props: ['content', 'herokuConfig'],
    mounted() {
        this.herokuInstance = new Heroku(this.herokuConfig.token);
        this.formation = JSON.parse(this.content);
        this.herokuInstance.apiFetch('/dyno-sizes', this.herokuConfig.node.ids).
            then((response: any) => {
                this.dynoSizes = response.data;
            });
    },

    methods: {
        scale(key: any)  {
            if (this.herokuInstance)    {
                this.message = 'Processing...';
                this.herokuInstance.apiPatch('/apps/{app_id}/formation',
                    this.herokuConfig.node.ids,
                    {      
                        "updates": [
                            {
                                "quantity": this.formation[key].quantity,
                                "size": this.formation[key].size,
                                "type": this.formation[key].type,
                            }
                        ]
                    }
                )
                .then(() => {
                    this.message = 'Scaling updated!';
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
    width: 20%;
    border: 1px solid;
}

input[type="number"] {
    background: white;
    color: #313030;
    width: 8ch;
    margin: auto;
    display: block;
}

select {
    background: white;
    color: #313030;
    width: 80%;
    margin: auto;
    display: block;
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
    margin: auto;
    display: block;
}
</style>
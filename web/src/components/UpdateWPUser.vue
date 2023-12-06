<template>
    <div>
        <div class="form">
            <div class="form-row">
                <label for="userEMail">Email address</label>
                <input class="field_value" type="email" id="userEMail" v-model="userEMail" />
            </div>
            <div class="form-row">
                <label for="password">Password</label>
                <input class="field_value" type="text" id="password" v-model="userPassword" />
                <button class="button" @click="generatePWD()">Generate password</button>
            </div>
            <div class="form-row">
                <button :disabled="invalidEmail || userPassword == ''" class="button" @click="updatePWD()">Add</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineComponent, inject } from 'vue';
import { vscode } from '../utilities/vscode';
</script>

<script lang="ts">
export default defineComponent({
    data(): {
        userPassword: string,
        userEMail: string,
    } {
        return {
            userPassword: '',
            userEMail: '',
        };
    },

    mounted()   {
       
    },

    methods: {
        updatePWD() {
            vscode.postMessage({
                'command': 'updateWPPassword', 
                'sourceID': 'team',
                'data': {
                    'password' : this.userPassword,
                    'email' : this.userEMail,
                }
            });
        },

        generatePWD() {
            const length = 20;
            const validChar = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=;:@!%*";

            this.userPassword = Array(length).fill(validChar).map(function(x) { return x[Math.floor(Math.random() * x.length)] }).join('');
        }
    },

    computed:   {
        invalidEmail() : boolean    {
            return this.userEMail == '' || 
                (this.userEMail.toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
                    == null);
        }
    }
});
</script>

<style scoped>
.form {
    display: table;              
    width: 90%;
    max-width: 100em;
}

.form-row {
    display: table-row;
    width: 80%;
    clear: both;
}
.env-header {
    background-color: darkslategray;
    padding: 5px;
    text-align: center;
}
label {
    display: table-cell;
    width: 20%;
    padding: 5px;
}
.field_value  {
    display: table-cell;
    width: 40%;
    padding: 5px;
    margin-right: 1em;
}

input[type="text"]:disabled {
  background: #313030;
  color: white;
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
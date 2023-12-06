<template>
    <h1>User Bank...</h1>
    <div>       
        <div class="env-table">
            <div class="env-row env-header">
                <div class="head_selector">                    
                    <input type="checkbox"
                            @click="toggleUserBank()"
                            v-model="userBankState"
                            />
                </div>
                <div class="variable_name">email</div>
                <div class="variable_name">role</div>
            </div>
            <div v-for="user in userBank" 
                    :key="'bank_' + user.id"
                    class="env-row">
                <div class="table_selector">                 
                    <input type="checkbox"
                        v-model="user.checked"
                        v-if="!user.inTeam"
                        />
                </div>
                <div class="variable_name">{{ user.email }}</div>
                <div class="variable_name">
                    <select v-model="user.role">
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                    </select>
                </div>
            </div>
        </div>

        <div>
            <input class="variable_name" type="text" v-model="userName" placeholder="name" />
            <input class="variable_name" type="email" v-model="userEMail" placeholder="email address" />
            <button class="button" @click="addUserToBank">Add user to bank</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import { vscode } from '../utilities/vscode';
</script>

<script lang="ts">
export default defineComponent({
    data(): {
        displayRole: StringIndexed,
        userName: string,
        userEMail: string,
        userBank: any,
        userBankState: boolean,
    } {
        return {
            displayRole: [],
            userName: '',
            userEMail: '',
            userBank: {},
            userBankState: false,
        };
    },
    props: ['extraData'],

    created: function () {
        addEventListener('message', this.updateUsers);
    },
    destroyed: function () {
        removeEventListener('message', this.updateUsers);
    },

    mounted() {
        this.userBank = this.extraData.users || {};
    },
    methods: {
        addUserToBank() {
            let newUser = {
                'name' : this.userName,
                'email' : this.userEMail,
            };
            vscode.postMessage({
                'command': 'addUser', 
                'sourceID': 'team',
                'data': {
                    [this.userEMail]: newUser,
                }
            });
            this.userBank[this.userEMail] = newUser;
        },

        updateUsers(event: any)   {
            const message = event.data;

            switch (message.command) {
                case 'update':
                    this.userBank = message.data;
                    break;
            }
        },
        toggleUserBank()    {
            Object.keys(this.userBank).forEach((userName: any) => {
                this.userBank[userName].checked = !this.userBankState;
            })
        },
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
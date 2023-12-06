<template>
    <h1>User Display...</h1>
    <div>
        <div class="env-table">
            <div class="env-row env-header">
                <div class="head_selector">
                    <input type="checkbox"
                        @click="toggleSelect()"
                        v-model="selectedState"
                        />
                </div>
                <div class="variable_name">email</div>
                <div class="variable_name">name</div>
            </div>
            <div v-for="user in usersInTeam" 
                    :key="user.id"
                    class="env-row">
                <div class="table_selector">
                    <input type="checkbox"
                        v-model="user.checked"
                        />
                </div>
                <div class="variable_name">{{ user.email }}</div>
                <div class="variable_name">{{ user.name }}</div>
            </div>
        </div>
    </div>

    <div>
        <h2 @click="displayUserBank = !displayUserBank">
            User bank
            <span v-if="displayUserBank">&lt;</span>
            <span v-else>&gt;</span>
        </h2>
        <div v-show="displayUserBank">
            <button class="button" @click="addUsersToBank">Add selected users to bank</button>
        </div>

        <div v-show="displayUserBank">
            <button class="button" @click="addUserToTeam()">Add users to team</button>
        </div>
        <div class="env-table" v-show="displayUserBank">
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

    </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import { vscode } from '../utilities/vscode';
import { Heroku } from '../Heroku';
</script>

<script lang="ts">
export default defineComponent({
    data(): {
        usersInTeam: any,
        displayRole: StringIndexed,
        userName: string,
        userEMail: string,
        userBank: any,
        displayUserBank: boolean,
        selectedState: boolean,
        userBankState: boolean,
        herokuInstance: Heroku | null,
    } {
        return {
            usersInTeam: {},
            displayRole: [],
            userName: '',
            userEMail: '',
            userBank: {},
            displayUserBank: false,
            selectedState: false,
            userBankState: false,
            herokuInstance: null
        };
    },
    props: ['content', 'extraData', 'herokuConfig'],

    created: function () {
        addEventListener('message', this.updateUsers);
    },
    destroyed: function () {
        removeEventListener('message', this.updateUsers);
    },

    mounted() {
        this.herokuInstance = new Heroku(this.herokuConfig.token);
        this.usersInTeam = JSON.parse(this.content);
        this.userBank = this.extraData.users || {};
        this.filterUserBankList();
    },
    methods: {
        updateUsers(event: any)   {
            const message = event.data;

            switch (message.command) {
                case 'update':
                    this.userBank = message.data;
                    this.filterUserBankList();
                    break;
            }
        },

        toggleSelect()  {
            this.usersInTeam.forEach((user: any) => {
                user.checked = !this.selectedState;
            })
        },

        toggleUserBank()    {
            Object.keys(this.userBank).forEach((userName: any) => {
                this.userBank[userName].checked = !this.userBankState;
            })
        },

        // Add selected users to user bank
        addUsersToBank()    {
            this.usersInTeam.forEach((user: any) => {
                if (user.checked)   {
                    vscode.postMessage({
                        'command': 'addUser',
                        'sourceID': 'team',
                        'data': {
                            [user.email]: {
                                'name': user.user.name,
                                'email': user.email,
                                'id': user.user.id,
                                'role': user.role
                            },
                        }
                    });
                }
            });
        },

        // Send invites to the selected users
        addUserToTeam() {
            Object.keys(this.userBank).forEach((email: any) => {
                if (this.herokuInstance && this.userBank[email].checked == true) {
                    this.herokuInstance.apiPut('/teams/{team_id}/invitations',
                        this.herokuConfig.node.ids,
                        {
                            email: email,
                            role: this.userBank[email].role,
                        });
                }
            })
        },

        // Flags users in bank who are already part of this team
        filterUserBankList()    {
            this.usersInTeam.forEach((user: any) => {
                if (this.userBank[user.email])  {
                    this.userBank[user.email].inTeam = true;
                }
            })
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
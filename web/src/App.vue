<template>
    <KeepAlive>
        <component :is="componentType" 
                :content="contentJSON" 
                :storageUri="globalStorageUri" 
                :herokuConfig="herokuConfig"
                :extraData="extraData"
                :uri="uri"
                />
    </KeepAlive>
</template>

<script setup lang="ts">
import JSONView from './components/JSONView.vue'
import JSONDump from './components/JSONDump.vue'
import UserDisplay from './components/UserDisplay.vue'
import Domains from './components/Domains.vue'
import Formation from './components/Formation.vue'
import EnvironmentVariables from './components/EnvironmentVariables.vue'
import Addons from './components/Addons.vue'
import Overview from './components/Overview.vue'
import UserBank from './components/UserBank.vue'
import UpdateWPUser from './components/UpdateWPUser.vue'
import { defineComponent } from 'vue';
import { Heroku } from './Heroku';
import { decode } from 'html-entities';
</script>

<script lang="ts">
export default defineComponent({
    components: {
        JSONView,
        JSONDump,
        UserDisplay,
        Domains,
        EnvironmentVariables,
        Addons,
        Overview,
        Formation,
        UserBank,
        UpdateWPUser,
    },
    data() : {
        baseUri: String | null,
        herokuConfig: any,
        contentJSON: any,
        componentType: String | null,
        globalStorageUri: String | null,
        extraData: any,
        uri: string,
    }
    {
        return {
            baseUri: '',
            herokuConfig: null,
            contentJSON: null,
            componentType: '',
            globalStorageUri: null,
            extraData: null,
            uri: '',
        };
    },
    mounted() {
        const dataUri = document.querySelector('input[data-uri]');
        if (!dataUri) return;
        this.baseUri = dataUri.getAttribute('data-uri');

        const globalStorageUri = document.querySelector('input[data-storage-uri]');
        if (!globalStorageUri) return;
        this.globalStorageUri = globalStorageUri.getAttribute('data-storage-uri');
        
        const extraData = document.querySelector('input[data-extra-data]');
        if (extraData)   {
            this.extraData = JSON.parse(decode(extraData.getAttribute('data-extra-data')));
        }

        const componentType = document.querySelector('input[data-component]');
        if (!componentType) return;

        const herokuConfig = document.querySelector('input[data-content]');
        if (!herokuConfig) return;
        if (herokuConfig.getAttribute('data-content'))  {
            this.herokuConfig = JSON.parse(decode(herokuConfig.getAttribute('data-content')));

            const herokuInstance = new Heroku(this.herokuConfig.token);
            console.log('mounted', this.herokuConfig.uri);
            herokuInstance.apiFetch(this.herokuConfig.uri, this.herokuConfig.node['ids']).
                then((response: any) => {
                    this.contentJSON = JSON.stringify(response.data, null, 4);
                    this.componentType = componentType.getAttribute('data-component');
                });

        }
        else    {
            this.componentType = componentType.getAttribute('data-component');
        }
     },

})
</script>


<template>
    <h1>{{ details.name }}</h1>
    <a :href="'https://dashboard.heroku.com/apps/' + details.name"><h2>Heroku page</h2></a>
    <a :href="details.web_url"><h2>Open site</h2></a>
    <a :href="details.web_url + '/admin/wp-admin'"><h2>Admin site</h2></a>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
</script>

<script lang="ts">
export default defineComponent({
    data(): {
        details: any,
    } {
        return {
            details: {},
        };
    },
    props: ['content'],
    mounted() {
        this.details = JSON.parse(this.content);
    }
});
</script>

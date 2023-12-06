<template>
    <h1>Addons...</h1>
    <div v-for="addon in addons" :key="addon.id">
        <a :href="addon.web_url">{{ addon.addon_service.name }}</a> : {{ addon.plan.name }}<br />
    </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
</script>

<script lang="ts">
export default defineComponent({
    data(): {
        addons: StringIndexed,
    } {
        return {
            addons: [],
        };
    },
    props: ['content'],
    mounted() {
        this.addons = JSON.parse(this.content);
    }
});
</script>

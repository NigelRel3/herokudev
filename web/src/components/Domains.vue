<template>
    <h1>Domains</h1>
    <div v-for="domain in domains" :key="domain.id">
        {{ domain.hostname }} : {{ domain.cname }} {{ domain.kind }} {{ domain.status }}<br />
    </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
</script>

<script lang="ts">
export default defineComponent({
    data(): {
        domains: StringIndexed,
    } {
        return {
            domains: [],
        };
    },
    props: ['content'],
    mounted() {
        this.domains = JSON.parse(this.content);
    }
});
</script>

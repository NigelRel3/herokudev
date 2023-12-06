<template>
    <h1>JSONView</h1>
    <div v-for="(value, name) in fields" :key="name">
        {{ name }} : {{ value }}<br />
    </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
</script>

<script lang="ts">
export default defineComponent({
    data(): {
        fields: StringIndexed,
    } {
        return {
            fields: [],
        };
    },
    props: ['content'],
    mounted() {
        this.fields = JSON.parse(this.content);
    }
});
</script>

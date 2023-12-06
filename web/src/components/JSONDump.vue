<template>
    <h1>JSONDump</h1>
    <div>
        {{ content }}
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
    }
});
</script>

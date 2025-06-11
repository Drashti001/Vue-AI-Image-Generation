<template>
  <FreeAIImageGenerator />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import FreeAIImageGenerator from "./components/FreeAIImageGenerator.vue";

export default defineComponent({
  name: "App",
  components: {
    FreeAIImageGenerator,
  },
});
</script>
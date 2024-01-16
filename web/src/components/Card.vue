<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{
  backgroundPath?: string;
  classes?: string[];
}>()
</script>

<template>
  <div :class="['card', ...(props.classes ?? [])]">
    <div class="text"><slot></slot></div>
    <div v-if="props.backgroundPath" class="background">
      <div class="overlay"></div>
      <img
        :src="props.backgroundPath"
        style="height: 100%; width: 100%; object-fit: cover"
      />
    </div>
  </div>
</template>

<style scoped>
  .card {
    position: relative;
    color: var(--text-primary-color);
    background-color: var(--primary-darker-color);
    border-radius: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .card .text {
    /* padding: 1rem; */
    z-index: 1;
  }
  .card .background {
    border-radius: 30px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    z-index: 0;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
  }
  .card .background .overlay {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.5);
    width: 100%;
    height: 100%;
  }
</style>

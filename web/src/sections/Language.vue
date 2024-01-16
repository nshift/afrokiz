<script setup>
import { onMounted, ref } from "vue";

const { localStorage } = window;
const languages = {
  fr: { id: "fr", icon: "🇫🇷" },
  en: { id: "en", icon: "🇬🇧" },
};
const defaultLanguage = languages.en.id;
const selectedLanguage = ref(defaultLanguage);

onMounted(() => {
  const userLocale = localStorage.getItem("language");
  console.log({ userLocale });
  if (!userLocale) {
    localStorage.setItem("language", defaultLanguage);
  }
  selectedLanguage.value = userLocale ?? defaultLanguage;
});

const changeLanguage = () => {
  localStorage.setItem("language", selectedLanguage.value);
};
</script>

<template>
  <select class="languages" v-model="selectedLanguage" @change="changeLanguage">
    <option
      v-for="language in Object.values(languages)"
      :value="language.id"
      :key="language.id"
    >
      {{ language.icon }}
    </option>
  </select>
</template>

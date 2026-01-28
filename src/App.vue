<script setup>
// No imports needed here
</script>

<template>
  <nav class="main-nav">
    <router-link to="/">Student Exam</router-link> | 
    <router-link to="/admin">Teacher Panel</router-link>
    
  </nav>
  
  <router-view />
</template>

<style>
body { margin: 0; background-color: #f4f6f8; font-family: sans-serif; }
.main-nav { background: #333; padding: 15px; text-align: center; color: white; }
.main-nav a { color: #fff; text-decoration: none; font-weight: bold; margin: 0 10px; }
.main-nav a.router-link-active { color: #42b883; text-decoration: underline; }
</style>
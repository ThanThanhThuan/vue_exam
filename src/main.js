import { createApp } from 'vue'
import './style.css' // if exists, otherwise remove
import App from './App.vue'
import router from './router'

createApp(App)
    .use(router)
    .mount('#app')
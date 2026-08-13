import { createApp } from 'vue'
import VWave from 'v-wave'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(VWave, {})
app.mount('#app')

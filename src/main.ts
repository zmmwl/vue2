import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// VueFlow 样式导入
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const app = createApp(App)

app.use(router)
app.mount('#app')

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/index.css'
import store from './store'
import * as wanki from './plugins/wankidb'

import longPress from '@/plugins/directives/longPress.js'
import ripple from '@/plugins/directives/ripple.js'
import autofocus from '@/plugins/directives/autofocus.js'

const app = createApp(App)
app.config.devtools = true
app.use(router)
app.use(store)
app.directive('long-press', longPress)
app.directive('autofocus', autofocus)
app.directive('ripple', ripple)

app.config.globalProperties.$wanki = wanki.default
window.wanki = wanki.default

app.mount('#app')

if (!import.meta.hot) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
  }
}

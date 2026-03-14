import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import "./style.css";

// 1. 引入 Element Plus
import ElementPlus from 'element-plus'
// 2. 引入 Element Plus 样式
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
// 3. (可选) 引入中文语言包
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const app = createApp(App)

window.addEventListener("error", (event) => {
  console.error(event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error(event.reason);
});

app.use(router)

// 4. 使用 Element Plus
app.use(ElementPlus, {
  locale: zhCn,
})

app.config.errorHandler = (error) => {
  console.error(error);
};

try {
  app.mount('#app')
} catch (error) {
  console.error(error);
}

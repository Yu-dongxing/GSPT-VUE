import { createRouter, createWebHistory } from "vue-router";
import { TOKEN_KEY } from "../utils/request";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/",
    redirect: "/users",
  },
  {
    path: "/users",
    name: "users",
    component: () => import("../views/UserManageView.vue"),
    meta: { title: "用户管理" },
  },
  {
    path: "/articles",
    name: "articles",
    component: () => import("../views/ArticleManageView.vue"),
    meta: { title: "文章管理" },
  },
  {
    path: "/files",
    name: "files",
    component: () => import("../views/FileManageView.vue"),
    meta: { title: "文件管理" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (to.path !== "/login" && !token) {
    next("/login");
    return;
  }

  if (to.path === "/login" && token) {
    next("/users");
    return;
  }

  next();
});

export default router;

<template>
  <div v-if="isLoginPage" class="login-shell">
    <RouterView />
  </div>
  <div v-else class="layout-shell">
    <aside class="sidebar" :class="{ open: mobileMenuOpen }">
      <div class="brand">
        <div class="brand-mark">GS</div>
        <div>
          <div class="brand-title">独立站管理后台</div>
          <div class="brand-subtitle">Global Site Portal</div>
        </div>
      </div>

      <nav class="nav-list">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: route.path === item.to }"
          @click="mobileMenuOpen = false"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="account-card">
          <div class="account-name">{{ currentUser?.username || "未登录" }}</div>
          <div class="account-meta">{{ roleMap[currentUser?.role] || "管理员" }}</div>
        </div>
      </div>
    </aside>

    <div v-if="mobileMenuOpen" class="sidebar-mask" @click="mobileMenuOpen = false"></div>

    <div class="main-shell">
      <header class="topbar">
        <div class="topbar-left">
          <el-button class="menu-button" text @click="mobileMenuOpen = !mobileMenuOpen">
            <el-icon :size="20"><Operation /></el-icon>
          </el-button>
          <div class="page-title">{{ route.meta.title || "管理后台" }}</div>
        </div>

        <div class="topbar-right">
          <el-button circle @click="toggleTheme">
            <el-icon><component :is="isDark ? Sunny : Moon" /></el-icon>
          </el-button>

          <el-dropdown>
            <div class="account-entry">
              <el-avatar :size="32">{{ userInitial }}</el-avatar>
              <div class="account-text">
                <div>{{ currentUser?.username || "管理员" }}</div>
                <small>{{ roleMap[currentUser?.role] || "管理员" }}</small>
              </div>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile')">个人中心</el-dropdown-item>
                <el-dropdown-item @click="refreshCurrentUser">刷新用户信息</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="page-body">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowDown, Document, Folder, Moon, Operation, Sunny, User } from "@element-plus/icons-vue";
import { getCurrentUser, logout } from "./api/user";
import { getStoredTheme, setStoredTheme, TOKEN_KEY } from "./utils/request";

const route = useRoute();
const router = useRouter();

const currentUser = ref(null);
const mobileMenuOpen = ref(false);
const isDark = ref(false);

const roleMap = {
  1: "普通用户",
  2: "企业用户",
  3: "管理员",
};

const navItems = [
  { title: "用户管理", to: "/users", icon: User },
  { title: "文章管理", to: "/articles", icon: Document },
  { title: "文件管理", to: "/files", icon: Folder },
];

const isLoginPage = computed(() => route.path === "/login");
const userInitial = computed(
  () => currentUser.value?.username?.slice(0, 1)?.toUpperCase() || "A"
);

function applyTheme(theme) {
  isDark.value = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark.value);
  setStoredTheme(theme);
}

function toggleTheme() {
  applyTheme(isDark.value ? "light" : "dark");
}

async function refreshCurrentUser() {
  if (isLoginPage.value) {
    return;
  }

  try {
    const res = await getCurrentUser();
    currentUser.value = res.data || null;
  } catch {
    currentUser.value = null;
  }
}

async function handleLogout() {
  try {
    await logout();
  } catch {
    // 请求层统一处理
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    currentUser.value = null;
    router.replace("/login");
  }
}

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false;
    if (!isLoginPage.value) {
      refreshCurrentUser();
    }
  },
  { immediate: true }
);

onMounted(() => {
  applyTheme(getStoredTheme());
});
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
}

.layout-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  background: var(--app-bg);
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--panel-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px 20px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--brand-color);
  color: #fff;
  font-weight: 700;
}

.brand-title {
  font-size: 16px;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-muted);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  color: var(--text-soft);
}

.nav-item:hover {
  background: var(--hover-bg);
  color: var(--brand-color);
}

.nav-item.active {
  background: var(--brand-color);
  color: #fff;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 10px 0;
}

.account-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--card-muted-bg);
  border: 1px solid var(--panel-border);
}

.account-name {
  font-weight: 600;
}

.account-meta {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
}

.main-shell {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--panel-bg);
  border-bottom: 1px solid var(--panel-border);
}

.topbar-left,
.topbar-right,
.account-entry {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
}

.account-text small,
.account-meta {
  color: var(--text-muted);
}

.account-entry {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  cursor: pointer;
}

.account-text {
  line-height: 1.2;
}

.page-body {
  padding: 20px 24px;
}

.menu-button,
.sidebar-mask {
  display: none;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.18s ease;
}

.fade-transform-enter-from,
.fade-transform-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 900px) {
  .layout-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 240px;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    z-index: 30;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-mask {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 20;
  }

  .menu-button {
    display: inline-flex;
  }

  .page-body,
  .topbar {
    padding-left: 16px;
    padding-right: 16px;
  }

  .account-text {
    display: none;
  }
}
</style>

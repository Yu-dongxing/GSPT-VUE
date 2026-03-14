<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="login-header">
        <div class="login-badge">GSPT ADMIN</div>
        <h1>后台管理登录</h1>
      </div>

      <el-form :model="form" label-position="top" @submit.prevent="handleSubmit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入管理员用户名" clearable />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入管理员密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" class="login-action" @click="handleSubmit">
          登录系统
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { loginAdmin } from "../api/user";
import { TOKEN_KEY } from "../utils/request";

const router = useRouter();
const loading = ref(false);
const form = reactive({
  username: "",
  password: "",
});

async function handleSubmit() {
  if (!form.username || !form.password) {
    return;
  }

  loading.value = true;
  try {
    const res = await loginAdmin(form);
    const token = res.data?.tokenValue;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      router.replace("/users");
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: linear-gradient(180deg, #f4f8ff 0%, #e9f1ff 100%);
}

.login-panel {
  width: min(100%, 420px);
  padding: 32px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(37, 99, 235, 0.12);
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.1);
}

.login-header {
  margin-bottom: 20px;
}

.login-badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 12px;
}

h1 {
  margin: 0;
  font-size: 30px;
  color: #0f172a;
}

p {
  margin: 12px 0 0;
  color: #64748b;
}

.login-action {
  width: 100%;
  margin-top: 8px;
}
</style>

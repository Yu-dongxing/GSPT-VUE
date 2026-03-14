<template>
  <section class="page-section">
    <div class="content-card">
      <div class="content-card__header">
        <div class="section-title">个人中心</div>
        <div class="section-subtitle">在这里修改个人资料和登录密码。</div>
      </div>
      <div class="content-card__body profile-grid">
        <div class="content-card profile-card">
          <div class="content-card__header">
            <div class="section-title">修改个人信息</div>
          </div>
          <div class="content-card__body">
            <el-form :model="profileForm" label-width="96px" class="dialog-form">
              <el-form-item label="用户名">
                <el-input :model-value="currentUser?.username || '-'" disabled />
              </el-form-item>
              <el-form-item label="昵称">
                <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
              </el-form-item>
              <template v-if="Number(currentUser?.role) === 2">
                <el-form-item label="企业名称">
                  <el-input v-model="profileForm.companyName" placeholder="请输入企业名称" />
                </el-form-item>
                <el-form-item label="执照名称">
                  <el-input v-model="profileForm.licenseName" placeholder="请输入营业执照名称" />
                </el-form-item>
                <el-form-item label="营业执照">
                  <div class="toolbar-row" style="align-items: center;">
                    <el-button :loading="licenseUploading" @click="licenseInputRef?.click()">上传营业执照</el-button>
                    <a
                      v-if="profileForm.licenseUrl"
                      :href="resolveAssetUrl(profileForm.licenseUrl)"
                      target="_blank"
                      class="mono-text"
                    >
                      已上传，点击查看
                    </a>
                    <span v-else class="section-subtitle">未上传营业执照</span>
                  </div>
                </el-form-item>
              </template>
              <el-form-item>
                <el-button type="primary" :loading="profileSubmitting" @click="submitProfile">
                  保存个人信息
                </el-button>
              </el-form-item>
            </el-form>
            <input
              ref="licenseInputRef"
              type="file"
              class="hidden-input"
              accept="image/*,.pdf"
              @change="handleLicenseUpload"
            />
          </div>
        </div>

        <div class="content-card profile-card">
          <div class="content-card__header">
            <div class="section-title">修改密码</div>
          </div>
          <div class="content-card__body">
            <el-form :model="passwordForm" label-width="96px" class="dialog-form">
              <el-form-item label="旧密码">
                <el-input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  show-password
                  placeholder="请输入旧密码"
                />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  show-password
                  placeholder="请输入新密码"
                />
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  show-password
                  placeholder="请再次输入新密码"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="passwordSubmitting" @click="submitPassword">
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { uploadFile } from "../api/file";
import { changeCurrentUserPassword, getCurrentUser, updateCurrentUserProfile } from "../api/user";
import { resolveAssetUrl } from "../utils/request";

const currentUser = ref(null);
const profileSubmitting = ref(false);
const passwordSubmitting = ref(false);
const licenseUploading = ref(false);
const licenseInputRef = ref(null);

const profileForm = reactive({
  nickname: "",
  email: "",
  companyName: "",
  licenseName: "",
  licenseFileId: null,
  licenseUrl: "",
});

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

function syncProfileForm(data = {}) {
  currentUser.value = data || null;
  profileForm.nickname = data?.nickname || "";
  profileForm.email = data?.email || "";
  profileForm.companyName = data?.companyName || "";
  profileForm.licenseName = data?.licenseName || "";
  profileForm.licenseFileId = data?.licenseFileId || null;
  profileForm.licenseUrl = data?.licenseUrl || "";
}

async function fetchCurrentUser() {
  const res = await getCurrentUser();
  syncProfileForm(res.data || {});
}

async function handleLicenseUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    return;
  }

  licenseUploading.value = true;
  try {
    const res = await uploadFile(file);
    profileForm.licenseFileId = res.data?.id || null;
    profileForm.licenseUrl = res.data?.accessUrl || res.data?.fileUrl || "";
  } finally {
    licenseUploading.value = false;
  }
}

async function submitProfile() {
  const payload = {
    nickname: profileForm.nickname || undefined,
    email: profileForm.email || undefined,
    companyName: Number(currentUser.value?.role) === 2 ? profileForm.companyName || undefined : undefined,
    licenseName: Number(currentUser.value?.role) === 2 ? profileForm.licenseName || undefined : undefined,
    licenseFileId: Number(currentUser.value?.role) === 2 ? profileForm.licenseFileId || undefined : undefined,
    licenseUrl: Number(currentUser.value?.role) === 2 ? profileForm.licenseUrl || undefined : undefined,
  };

  profileSubmitting.value = true;
  try {
    const res = await updateCurrentUserProfile(payload);
    syncProfileForm(res.data || {});
  } finally {
    profileSubmitting.value = false;
  }
}

async function submitPassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.error("请完整填写密码信息");
    return;
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error("两次输入的新密码不一致");
    return;
  }

  passwordSubmitting.value = true;
  try {
    await changeCurrentUserPassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    passwordForm.oldPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
  } finally {
    passwordSubmitting.value = false;
  }
}

onMounted(fetchCurrentUser);
</script>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.profile-card {
  box-shadow: none;
}

.hidden-input {
  display: none;
}
</style>

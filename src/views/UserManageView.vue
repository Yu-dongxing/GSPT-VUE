<template>
  <section class="page-section">
    <div class="content-card">
      <div class="content-card__header">
        <div class="section-title">用户管理</div>
      </div>
      <div class="content-card__body">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="用户名">
            <el-input v-model="filters.username" clearable placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="filters.email" clearable placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="企业名称">
            <el-input v-model="filters.companyName" clearable placeholder="请输入企业名称" />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="filters.role" clearable placeholder="全部角色" style="width: 160px;">
              <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="审核状态">
            <el-select v-model="filters.auditStatus" clearable placeholder="全部状态" style="width: 160px;">
              <el-option v-for="item in auditStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="createRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item>
            <div class="toolbar-row">
              <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
              <el-button type="success" @click="openCreateDialog">添加用户</el-button>
            </div>
          </el-form-item>
        </el-form>

        <el-table :data="tableData" v-loading="loading" style="width: 100%;">
          <el-table-column prop="id" label="ID" width="90" />
          <el-table-column prop="username" label="用户名" min-width="140" />
          <el-table-column prop="email" label="邮箱" min-width="180">
            <template #default="{ row }">
              {{ row.email || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="companyName" label="企业名称" min-width="180">
            <template #default="{ row }">
              {{ row.companyName || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="role" label="角色" width="120">
            <template #default="{ row }">
              <el-tag>{{ roleMap[row.role] || row.role }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="auditStatus" label="审核状态" width="140">
            <template #default="{ row }">
              <el-tag :type="auditTagType[row.auditStatus] || 'info'">
                {{ auditStatusMap[row.auditStatus] || row.auditStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="auditRemark" label="审核备注" min-width="180">
            <template #default="{ row }">
              {{ row.auditRemark || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="营业执照" min-width="160">
            <template #default="{ row }">
              <a v-if="row.licenseUrl" :href="resolveAssetUrl(row.licenseUrl)" target="_blank">查看执照</a>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="170" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <div class="inline-actions">
                <el-button v-if="showAuditAction(row)" type="primary" link @click="openAuditDialog(row)">
                  审核
                </el-button>
                <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
          <el-pagination
            background
            layout="total, prev, pager, next, sizes"
            :total="pagination.total"
            :current-page="pagination.pageNum"
            :page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="createDialogVisible" title="添加用户" width="620px">
      <el-form :model="createForm" label-width="96px" class="dialog-form">
        <el-form-item label="用户类型" required>
          <el-select v-model="createForm.role" style="width: 220px;" @change="handleRoleChange">
            <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号" required>
          <el-input v-model="createForm.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="createForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>

        <template v-if="Number(createForm.role) === 2">
          <el-form-item label="邮箱" required>
            <el-input v-model="createForm.email" placeholder="请输入企业邮箱" />
          </el-form-item>
          <el-form-item label="企业名称" required>
            <el-input v-model="createForm.companyName" placeholder="请输入企业名称" />
          </el-form-item>
          <el-form-item label="执照名称" required>
            <el-input v-model="createForm.licenseName" placeholder="请输入营业执照名称" />
          </el-form-item>
          <el-form-item label="营业执照" required>
            <div class="toolbar-row" style="align-items: center;">
              <el-button :loading="licenseUploading" @click="licenseInputRef?.click()">上传营业执照</el-button>
              <a
                v-if="createForm.licenseUrl"
                :href="resolveAssetUrl(createForm.licenseUrl)"
                target="_blank"
                class="mono-text"
              >
                已上传，点击查看
              </a>
              <span v-else class="section-subtitle">请先上传营业执照文件</span>
            </div>
          </el-form-item>
          <el-form-item label="审核状态">
            <el-tag type="success">审核通过</el-tag>
          </el-form-item>
        </template>
      </el-form>

      <input
        ref="licenseInputRef"
        type="file"
        class="hidden-input"
        accept="image/*,.pdf"
        @change="handleLicenseUpload"
      />

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createSubmitting" @click="submitCreateUser">确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="auditDialogVisible" title="企业用户审核" width="520px">
      <el-form :model="auditForm" label-width="88px" class="dialog-form">
        <el-form-item label="用户名">
          <el-input :model-value="currentAuditUser?.username || '-'" disabled />
        </el-form-item>
        <el-form-item label="企业名称">
          <el-input :model-value="currentAuditUser?.companyName || '-'" disabled />
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :label="2">通过</el-radio>
            <el-radio :label="3">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="auditForm.auditRemark" type="textarea" :rows="4" placeholder="请输入审核备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="auditSubmitting" @click="submitAudit">确认审核</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { uploadFile } from "../api/file";
import { addAdminUser, auditEnterpriseUser, deleteAdminUser, getAdminUserPage } from "../api/user";
import { resolveAssetUrl } from "../utils/request";

const roleOptions = [
  { label: "普通用户", value: 1 },
  { label: "企业用户", value: 2 },
  { label: "管理员", value: 3 },
];

const auditStatusOptions = [
  { label: "无需审核", value: 0 },
  { label: "待审核", value: 1 },
  { label: "审核通过", value: 2 },
  { label: "审核驳回", value: 3 },
];

const roleMap = Object.fromEntries(roleOptions.map((item) => [item.value, item.label]));
const auditStatusMap = Object.fromEntries(auditStatusOptions.map((item) => [item.value, item.label]));
const auditTagType = {
  0: "info",
  1: "warning",
  2: "success",
  3: "danger",
};

const loading = ref(false);
const tableData = ref([]);
const createRange = ref([]);
const auditDialogVisible = ref(false);
const auditSubmitting = ref(false);
const currentAuditUser = ref(null);
const createDialogVisible = ref(false);
const createSubmitting = ref(false);
const licenseUploading = ref(false);
const licenseInputRef = ref(null);

const filters = reactive({
  username: "",
  email: "",
  companyName: "",
  role: "",
  auditStatus: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
});

const auditForm = reactive({
  userId: null,
  auditStatus: 2,
  auditRemark: "",
});

const createForm = reactive(createUserForm());

function createUserForm() {
  return {
    username: "",
    password: "",
    email: "",
    companyName: "",
    licenseName: "",
    licenseFileId: null,
    licenseUrl: "",
    role: 1,
    auditStatus: 0,
    auditRemark: "",
  };
}

function resetCreateForm() {
  Object.assign(createForm, createUserForm());
}

function handleRoleChange(role) {
  if (Number(role) === 2) {
    createForm.auditStatus = 2;
    createForm.auditRemark = "后台创建并审核通过";
  } else {
    createForm.email = "";
    createForm.companyName = "";
    createForm.licenseName = "";
    createForm.licenseFileId = null;
    createForm.licenseUrl = "";
    createForm.auditStatus = 0;
    createForm.auditRemark = "";
  }
}

function buildParams() {
  return {
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    username: filters.username || undefined,
    email: filters.email || undefined,
    companyName: filters.companyName || undefined,
    role: filters.role || undefined,
    auditStatus: filters.auditStatus || undefined,
    startCreateTime: createRange.value?.[0] || undefined,
    endCreateTime: createRange.value?.[1] || undefined,
  };
}

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await getAdminUserPage(buildParams());
    const page = res.data || {};
    tableData.value = page.records || [];
    pagination.total = page.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.pageNum = 1;
  fetchUsers();
}

function handleReset() {
  filters.username = "";
  filters.email = "";
  filters.companyName = "";
  filters.role = "";
  filters.auditStatus = "";
  createRange.value = [];
  pagination.pageNum = 1;
  fetchUsers();
}

function handlePageChange(page) {
  pagination.pageNum = page;
  fetchUsers();
}

function handleSizeChange(size) {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  fetchUsers();
}

function showAuditAction(row) {
  return Number(row.role) === 2 && Number(row.auditStatus) === 1;
}

function openCreateDialog() {
  resetCreateForm();
  createDialogVisible.value = true;
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
    createForm.licenseFileId = res.data?.id || null;
    createForm.licenseUrl = res.data?.fileUrl || "";
  } finally {
    licenseUploading.value = false;
  }
}

async function submitCreateUser() {
  if (!createForm.username.trim() || !createForm.password.trim()) {
    ElMessage.error("账号和密码不能为空");
    return;
  }

  if (Number(createForm.role) === 2) {
    if (!createForm.email.trim() || !createForm.companyName.trim() || !createForm.licenseName.trim()) {
      ElMessage.error("企业用户请完整填写企业信息");
      return;
    }
    if (!createForm.licenseFileId || !createForm.licenseUrl) {
      ElMessage.error("请先上传营业执照");
      return;
    }
  }

  const payload = {
    username: createForm.username.trim(),
    password: createForm.password.trim(),
    email: Number(createForm.role) === 2 ? createForm.email.trim() : undefined,
    companyName: Number(createForm.role) === 2 ? createForm.companyName.trim() : undefined,
    licenseName: Number(createForm.role) === 2 ? createForm.licenseName.trim() : undefined,
    licenseFileId: Number(createForm.role) === 2 ? createForm.licenseFileId : undefined,
    licenseUrl: Number(createForm.role) === 2 ? createForm.licenseUrl : undefined,
    role: createForm.role,
    auditStatus: Number(createForm.role) === 2 ? 2 : 0,
    auditRemark: Number(createForm.role) === 2 ? "后台创建并审核通过" : undefined,
  };

  createSubmitting.value = true;
  try {
    await addAdminUser(payload);
    createDialogVisible.value = false;
    fetchUsers();
  } finally {
    createSubmitting.value = false;
  }
}

function openAuditDialog(row) {
  currentAuditUser.value = row;
  auditForm.userId = row.id;
  auditForm.auditStatus = 2;
  auditForm.auditRemark = row.auditRemark || "";
  auditDialogVisible.value = true;
}

async function submitAudit() {
  auditSubmitting.value = true;
  try {
    await auditEnterpriseUser({
      userId: auditForm.userId,
      auditStatus: auditForm.auditStatus,
      auditRemark: auditForm.auditRemark,
    });
    auditDialogVisible.value = false;
    fetchUsers();
  } finally {
    auditSubmitting.value = false;
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除用户“${row.username}”吗？`, "删除确认", {
      type: "warning",
    });
    await deleteAdminUser(row.id);
    if (tableData.value.length === 1 && pagination.pageNum > 1) {
      pagination.pageNum -= 1;
    }
    fetchUsers();
  } catch {
    // 用户取消删除
  }
}

onMounted(fetchUsers);
</script>

<style scoped>
.hidden-input {
  display: none;
}
</style>

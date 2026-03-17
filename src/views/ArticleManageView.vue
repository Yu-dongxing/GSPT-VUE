<template>
  <section class="page-section">
    <div class="content-card">
      <div class="content-card__header">
        <div class="section-title">文章管理</div>
      </div>
      <div class="content-card__body">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="标题">
            <el-input v-model="filters.title" clearable placeholder="请输入标题" />
          </el-form-item>
          <el-form-item label="作者">
            <el-input v-model="filters.authorName" clearable placeholder="请输入作者名称" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" clearable placeholder="全部状态" style="width: 160px;">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="filters.category" clearable placeholder="全部分类" style="width: 160px;">
              <el-option
                v-for="item in categoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
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
              <el-button type="success" @click="openCreateDialog">发布公司文章</el-button>
            </div>
          </el-form-item>
        </el-form>

        <el-table :data="tableData" v-loading="loading" style="width: 100%;">
          <el-table-column prop="id" label="ID" width="90" />
          <el-table-column label="封面" width="100">
            <template #default="{ row }">
              <img v-if="row.coverImageUrl" :src="resolveAssetUrl(row.coverImageUrl)" class="inline-cover" />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column prop="authorName" label="作者" min-width="120" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="Number(row.status) === 1 ? 'success' : 'info'">
                {{ statusMap[row.status] || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="120">
            <template #default="{ row }">
              <el-tag>{{ categoryMap[row.category] || row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="170" />
          <el-table-column prop="updateTime" label="更新时间" min-width="170" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <div class="inline-actions">
                <!-- v-if="Number(row.category) === 3" -->
                <el-button  type="primary" link @click="openEditDialog(row)">
                  编辑
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

    <el-dialog
      v-model="dialogVisible"
      :title="articleForm.id ? '编辑文章' : '发布公司文章'"
      width="960px"
      top="4vh"
      destroy-on-close
    >
      <el-form :model="articleForm" label-width="92px" class="dialog-form">
        <el-form-item label="标题" required>
          <el-input v-model="articleForm.title" maxlength="120" show-word-limit placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="预览内容" required>
          <el-input v-model="articleForm.previewContent" maxlength="120" show-word-limit placeholder="请输入预览内容" />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="articleForm.status" style="width: 180px;">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="文章分类">
  <el-select v-model="articleForm.category" disabled style="width: 180px;">
    <el-option
      v-for="item in categoryOptions"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
</el-form-item>
        <el-form-item label="封面图片">
          <div class="toolbar-row" style="align-items: center;">
            <el-button :loading="coverUploading" @click="coverInputRef?.click()">上传封面</el-button>
            <img v-if="articleForm.coverImageUrl" :src="resolveAssetUrl(articleForm.coverImageUrl)" class="inline-cover" />
            <span v-else class="section-subtitle">建议上传横版封面图</span>
          </div>
        </el-form-item>
        <el-form-item label="预览图">
          <div class="toolbar-row" style="align-items: center;">
            <el-button :loading="previewUploading" @click="previewInputRef?.click()">上传预览图</el-button>
            <img
              v-if="articleForm.previewImageUrl"
              :src="resolveAssetUrl(articleForm.previewImageUrl)"
              class="inline-cover"
            />
            <span v-else class="section-subtitle">可选，用于列表或分享预览</span>
          </div>
        </el-form-item>
        <el-form-item label="正文内容" required>
          <WangEditor v-model="articleForm.content" :height="360" placeholder="请输入文章正文，支持上传图片和视频" />
        </el-form-item>
      </el-form>

      <input ref="coverInputRef" type="file" class="hidden-input" accept="image/*" @change="handleCoverUpload" />
      <input
        ref="previewInputRef"
        type="file"
        class="hidden-input"
        accept="image/*"
        @change="handlePreviewUpload"
      />

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitArticle">确认保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import WangEditor from "../components/wangeditor.vue";
import {
  addAdminArticle,
  deleteAdminArticle,
  getAdminArticleDetail,
  getAdminArticlePage,
  updateAdminArticle,
} from "../api/article";
import { uploadFile } from "../api/file";
import { resolveAssetUrl } from "../utils/request";

const statusOptions = [
  { label: "草稿", value: 0 },
  { label: "已发布", value: 1 },
];

const categoryOptions = [
  { label: "需求", value: 1 },
  { label: "产品", value: 2 },
  { label: "公司", value: 3 },
];

const statusMap = Object.fromEntries(statusOptions.map((item) => [item.value, item.label]));
const categoryMap = Object.fromEntries(categoryOptions.map((item) => [item.value, item.label]));

const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const coverUploading = ref(false);
const previewUploading = ref(false);
const tableData = ref([]);
const createRange = ref([]);
const coverInputRef = ref(null);
const previewInputRef = ref(null);

const filters = reactive({
  title: "",
  authorName: "",
  status: "",
  category: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
});

const articleForm = reactive(createArticleForm());

function createArticleForm() {
  return {
    id: null,
    title: "",
    content: "",
    coverFileId: null,
    coverImageUrl: "",
    previewImageId: null,
    previewImageUrl: "",
    status: 0,
    category: 3,
    previewContent:""
  };
}

function resetArticleForm() {
  Object.assign(articleForm, createArticleForm());
}

function buildParams() {
  return {
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    title: filters.title || undefined,
    authorName: filters.authorName || undefined,
    status: filters.status || undefined,
    category: filters.category || undefined,
    startCreateTime: createRange.value?.[0] || undefined,
    endCreateTime: createRange.value?.[1] || undefined,
  };
}

async function fetchArticles() {
  loading.value = true;
  try {
    const res = await getAdminArticlePage(buildParams());
    const page = res.data || {};
    tableData.value = page.records || [];
    pagination.total = page.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.pageNum = 1;
  fetchArticles();
}

function handleReset() {
  filters.title = "";
  filters.authorName = "";
  filters.status = "";
  filters.category = "";
  createRange.value = [];
  pagination.pageNum = 1;
  fetchArticles();
}

function handlePageChange(page) {
  pagination.pageNum = page;
  fetchArticles();
}

function handleSizeChange(size) {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  fetchArticles();
}

function openCreateDialog() {
  resetArticleForm();
  dialogVisible.value = true;
}

async function openEditDialog(row) {
  const res = await getAdminArticleDetail(row.id);
  resetArticleForm();
  Object.assign(articleForm, res.data || {});
  dialogVisible.value = true;
}

async function uploadImage(event, targetKeyPrefix, loadingRef) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    return;
  }

  loadingRef.value = true;
  try {
    const res = await uploadFile(file);
    const fieldMap = {
      cover: {
        idKey: "coverFileId",
        urlKey: "coverImageUrl",
      },
      preview: {
        idKey: "previewImageId",
        urlKey: "previewImageUrl",
      },
    };
    const currentMap = fieldMap[targetKeyPrefix];
    const fileId = res.data?.id || null;
    const fileUrl = res.data?.fileUrl || "";

    if (!currentMap) {
      return;
    }

    articleForm[currentMap.idKey] = fileId;
    articleForm[currentMap.urlKey] = fileUrl;
  } finally {
    loadingRef.value = false;
  }
}

function handleCoverUpload(event) {
  return uploadImage(event, "cover", coverUploading);
}

function handlePreviewUpload(event) {
  return uploadImage(event, "preview", previewUploading);
}

function hasMeaningfulContent(html) {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim().length > 0 || /<(img|video)\b/i.test(html);
}

async function submitArticle() {
  if (!articleForm.title.trim() || !hasMeaningfulContent(articleForm.content)) {
    return;
  }

  if (
    (articleForm.coverFileId && !articleForm.coverImageUrl) ||
    (!articleForm.coverFileId && articleForm.coverImageUrl)
  ) {
    ElMessage.error("封面图片ID和访问地址必须同时提供");
    return;
  }

  if (
    (articleForm.previewImageId && !articleForm.previewImageUrl) ||
    (!articleForm.previewImageId && articleForm.previewImageUrl)
  ) {
    ElMessage.error("预览图文件ID和访问路径必须同时提供");
    return;
  }

  const payload = {
    id: articleForm.id || undefined,
    title: articleForm.title.trim(),
    content: articleForm.content,
    previewContent:articleForm.previewContent || '',
    coverFileId: articleForm.coverFileId || undefined,
    coverImageUrl: articleForm.coverImageUrl || undefined,
    previewImageId: articleForm.previewImageId || undefined,
    previewImageUrl: articleForm.previewImageUrl || undefined,
    status: articleForm.status,
    category: articleForm.category, 
  };

  submitting.value = true;
  try {
    if (articleForm.id) {
      await updateAdminArticle(payload);
    } else {
      await addAdminArticle(payload);
    }
    dialogVisible.value = false;
    fetchArticles();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除文章“${row.title}”吗？`, "删除确认", {
      type: "warning",
    });
    await deleteAdminArticle(row.id);
    if (tableData.value.length === 1 && pagination.pageNum > 1) {
      pagination.pageNum -= 1;
    }
    fetchArticles();
  } catch {
    // 用户取消删除
  }
}

onMounted(fetchArticles);
</script>

<style scoped>
.hidden-input {
  display: none;
}
</style>

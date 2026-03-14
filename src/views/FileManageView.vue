<template>
  <section class="page-section">
    <div class="content-card">
      <div class="content-card__header">
        <div class="section-title">文件管理</div>
      </div>
      <div class="content-card__body">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="原始名称">
            <el-input v-model="filters.originalName" clearable placeholder="请输入原始文件名" />
          </el-form-item>
          <el-form-item label="存储名称">
            <el-input v-model="filters.storageName" clearable placeholder="请输入存储名称" />
          </el-form-item>
          <el-form-item label="文件后缀">
            <el-input v-model="filters.fileSuffix" clearable placeholder="如 png/mp4" />
          </el-form-item>
          <el-form-item label="上传者">
            <el-input v-model="filters.uploaderName" clearable placeholder="请输入上传者" />
          </el-form-item>
          <el-form-item label="上传时间">
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
            </div>
          </el-form-item>
        </el-form>

        <el-table :data="tableData" v-loading="loading" style="width: 100%;">
          <el-table-column prop="id" label="ID" width="90" />
          <el-table-column prop="originalName" label="原始名称" min-width="180" />
          <el-table-column prop="storageName" label="存储名称" min-width="220" />
          <el-table-column prop="fileSuffix" label="后缀" width="100" />
          <el-table-column prop="fileSize" label="大小" width="120" />
          <el-table-column prop="uploaderName" label="上传者" min-width="140" />
          <el-table-column label="访问地址" min-width="240">
            <template #default="{ row }">
              <a class="mono-text ellipsis-text" :href="resolveAssetUrl(row.accessUrl)" target="_blank">
                {{ resolveAssetUrl(row.accessUrl) }}
              </a>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="上传时间" min-width="170" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deleteAdminFile, getAdminFilePage } from "../api/file";
import { resolveAssetUrl } from "../utils/request";

const loading = ref(false);
const tableData = ref([]);
const createRange = ref([]);

const filters = reactive({
  originalName: "",
  storageName: "",
  fileSuffix: "",
  uploaderName: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
});

function buildParams() {
  return {
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    originalName: filters.originalName || undefined,
    storageName: filters.storageName || undefined,
    fileSuffix: filters.fileSuffix || undefined,
    uploaderName: filters.uploaderName || undefined,
    startCreateTime: createRange.value?.[0] || undefined,
    endCreateTime: createRange.value?.[1] || undefined,
  };
}

async function fetchFiles() {
  loading.value = true;
  try {
    const res = await getAdminFilePage(buildParams());
    const page = res.data || {};
    tableData.value = page.records || [];
    pagination.total = page.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.pageNum = 1;
  fetchFiles();
}

function handleReset() {
  filters.originalName = "";
  filters.storageName = "";
  filters.fileSuffix = "";
  filters.uploaderName = "";
  createRange.value = [];
  pagination.pageNum = 1;
  fetchFiles();
}

function handlePageChange(page) {
  pagination.pageNum = page;
  fetchFiles();
}

function handleSizeChange(size) {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  fetchFiles();
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除文件“${row.originalName}”吗？`, "删除确认", {
      type: "warning",
    });
    await deleteAdminFile(row.id);
    if (tableData.value.length === 1 && pagination.pageNum > 1) {
      pagination.pageNum -= 1;
    }
    fetchFiles();
  } catch {
    // 用户取消删除
  }
}

onMounted(fetchFiles);
</script>

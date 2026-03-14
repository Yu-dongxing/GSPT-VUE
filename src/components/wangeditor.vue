<template>
  <div class="editor-shell">
    <div class="editor-toolbar">
      <el-button-group>
        <el-button @click="exec('bold')">加粗</el-button>
        <el-button @click="exec('italic')">斜体</el-button>
        <el-button @click="exec('insertUnorderedList')">列表</el-button>
      </el-button-group>
      <el-button-group>
        <el-button @click="setBlock('h2')">H2</el-button>
        <el-button @click="setBlock('h3')">H3</el-button>
        <el-button @click="setBlock('blockquote')">引用</el-button>
      </el-button-group>
      <el-button @click="insertLink">链接</el-button>
      <el-button :loading="imageUploading" @click="imageInputRef?.click()">图片</el-button>
      <el-button :loading="videoUploading" @click="videoInputRef?.click()">视频</el-button>
      <el-button @click="exec('removeFormat')">清除格式</el-button>
    </div>

    <div
      ref="editorRef"
      class="editor-content"
      :style="{ minHeight: `${height}px` }"
      contenteditable="true"
      @input="handleInput"
      @blur="handleInput"
    ></div>

    <div v-if="!hasValue" class="editor-placeholder">{{ placeholder }}</div>

    <input
      ref="imageInputRef"
      type="file"
      accept="image/*"
      class="hidden-input"
      @change="handleImageUpload"
              />
    <input
      ref="videoInputRef"
      type="file"
      accept="video/*"
      class="hidden-input"
      @change="handleVideoUpload"
    />
    </div>
  </template>
  
<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { uploadFile } from "../api/file";
import { resolveAssetUrl } from "../utils/request";

const props = defineProps({
      modelValue: {
        type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "请输入正文内容",
  },
  height: {
    type: Number,
    default: 320,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const editorRef = ref(null);
const imageInputRef = ref(null);
const videoInputRef = ref(null);
const imageUploading = ref(false);
const videoUploading = ref(false);

const hasValue = computed(() => {
  const html = editorRef.value?.innerHTML || props.modelValue || "";
  return html.replace(/<[^>]+>/g, "").trim().length > 0 || /<(img|video)\b/i.test(html);
});

function syncHtml(value) {
  if (!editorRef.value) {
    return;
  }

  if (editorRef.value.innerHTML !== value) {
    editorRef.value.innerHTML = value || "";
  }
}

function handleInput() {
  const html = editorRef.value?.innerHTML || "";
  emit("update:modelValue", html);
  emit("change", html);
}

function exec(command, value = null) {
  editorRef.value?.focus();
  document.execCommand(command, false, value);
  handleInput();
}

function setBlock(tagName) {
  exec("formatBlock", tagName);
}

function insertHtml(html) {
  editorRef.value?.focus();
  document.execCommand("insertHTML", false, html);
  handleInput();
}

function insertLink() {
  const url = window.prompt("请输入链接地址");
  if (!url) {
    return;
  }

  const text = window.prompt("请输入链接文本", url) || url;
  insertHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
}

async function doUpload(file, type) {
  const res = await uploadFile(file);
  const assetUrl = resolveAssetUrl(res.data?.accessUrl || res.data?.fileUrl);

  if (type === "image") {
    insertHtml(`<img src="${assetUrl}" alt="${file.name}" style="max-width:100%;border-radius:12px;" />`);
  } else {
    insertHtml(
      `<video controls src="${assetUrl}" style="max-width:100%;border-radius:12px;"></video>`
    );
  }
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    return;
  }

  imageUploading.value = true;
  try {
    await doUpload(file, "image");
  } finally {
    imageUploading.value = false;
        }
}

async function handleVideoUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    return;
  }

  videoUploading.value = true;
  try {
    await doUpload(file, "video");
  } finally {
    videoUploading.value = false;
  }
}

watch(
  () => props.modelValue,
  (value) => {
    syncHtml(value);
  }
);

onMounted(() => {
  nextTick(() => syncHtml(props.modelValue));
});
  </script>

<style scoped>
.editor-shell {
  position: relative;
  border: 1px solid var(--panel-border);
  border-radius: 20px;
  overflow: hidden;
  background: var(--panel-bg-strong);
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--panel-border);
  background: var(--surface-muted);
}

.editor-content {
  padding: 18px;
  color: var(--text-strong);
  outline: none;
}

.editor-content :deep(img),
.editor-content :deep(video) {
  display: block;
  margin: 12px 0;
}

.editor-placeholder {
  position: absolute;
  left: 20px;
  top: 68px;
  color: var(--text-muted);
  pointer-events: none;
}

.hidden-input {
  display: none;
}
</style>

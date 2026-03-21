import axios from "axios";
import { ElMessage } from "element-plus";
import router from "../router";
// // @ 未知者科技 
const DEFAULT_TIMEOUT = 15000;
const SUCCESS_CODE = 200;
const DEFAULT_SUCCESS_MESSAGE = "操作成功";
const DEFAULT_ERROR_MESSAGE = "请求失败";
const LOGIN_EXPIRED_MESSAGE = "登录状态已失效，请重新登录";

export const TOKEN_KEY = "Authorization";
export const TOKEN_NAME_STORAGE_KEY = "__gspt_token_name__";
export const CURRENT_USER_STORAGE_KEY = "__gspt_current_user__";

const THEME_KEY = "gspt-theme";
const RESULT_CODE_ENUM_NAME = "ResultCode";

// const baseURL ="http://127.0.0.1:8084/api";
const baseURL ="https://api.cnfctry.cn/api";

const service = axios.create({
  baseURL,
  timeout: DEFAULT_TIMEOUT,
});

let resultCodePromise = null;
let redirecting = false;

function getLocalStorageItem(key) {
  return window.localStorage.getItem(key);
}

function setLocalStorageItem(key, value) {
  window.localStorage.setItem(key, value);
}

function removeLocalStorageItem(key) {
  window.localStorage.removeItem(key);
}

export function getAuthToken() {
  return getLocalStorageItem(TOKEN_KEY) || "";
}

export function getAuthHeaderName() {
  return getLocalStorageItem(TOKEN_NAME_STORAGE_KEY) || TOKEN_KEY;
}

export function hasAuthSession() {
  return Boolean(getAuthToken());
}

function clearDefaultAuthHeaders() {
  const commonHeaders = service.defaults.headers.common || {};
  Object.keys(commonHeaders).forEach((key) => {
    if (/authorization/i.test(key)) {
      delete commonHeaders[key];
    }
  });
}

function syncDefaultAuthHeaders() {
  clearDefaultAuthHeaders();

  const token = getAuthToken();
  if (!token) {
    return;
  }

  service.defaults.headers.common[getAuthHeaderName()] = token;
}

export function setAuthSession(tokenName, tokenValue) {
  if (tokenName) {
    setLocalStorageItem(TOKEN_NAME_STORAGE_KEY, tokenName);
  }

  if (tokenValue) {
    setLocalStorageItem(TOKEN_KEY, tokenValue);
  }

  syncDefaultAuthHeaders();
}

export function clearAuthSession() {
  removeLocalStorageItem(TOKEN_KEY);
  removeLocalStorageItem(TOKEN_NAME_STORAGE_KEY);
  removeLocalStorageItem(CURRENT_USER_STORAGE_KEY);
  syncDefaultAuthHeaders();
}

export function setStoredCurrentUser(user) {
  if (!user) {
    removeLocalStorageItem(CURRENT_USER_STORAGE_KEY);
    return;
  }

  setLocalStorageItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
}

export function getStoredCurrentUser() {
  const raw = getLocalStorageItem(CURRENT_USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    removeLocalStorageItem(CURRENT_USER_STORAGE_KEY);
    return null;
  }
}

export function getStoredTheme() {
  return getLocalStorageItem(THEME_KEY) || "light";
}

export function setStoredTheme(theme) {
  setLocalStorageItem(THEME_KEY, theme);
}

export function getApiBaseUrl() {
  return baseURL;
}

export function getAssetBaseUrl() {
  return baseURL.replace(/\/api\/?$/, "");
}

export function resolveAssetUrl(url) {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${getAssetBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

function notify(message, type) {
  ElMessage({
    message,
    type,
    plain: true,
    showClose: true,
    duration: type === "success" ? 1800 : 2600,
  });
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function normalizeHeaders(headers) {
  if (!headers) {
    return {};
  }

  if (typeof headers.toJSON === "function") {
    return headers.toJSON();
  }

  if (isPlainObject(headers)) {
    return { ...headers };
  }

  return { ...headers };
}

function shouldAttachToken(config = {}) {
  return config.noAuth !== true;
}

function attachAuthHeaders(config = {}) {
  const nextConfig = { ...config };
  const headers = normalizeHeaders(config.headers);

  if (shouldAttachToken(config)) {
    const token = getAuthToken();
    if (token) {
      headers[getAuthHeaderName()] = token;
    }
  }

  nextConfig.headers = headers;
  return nextConfig;
}

function collectEnumItems(input) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input;
  }

  if (typeof input === "object") {
    return Object.values(input).flatMap((item) => collectEnumItems(item));
  }

  return [];
}

async function loadResultCodeMap() {
  if (!resultCodePromise) {
    resultCodePromise = service
      .request(
        attachAuthHeaders({
          url: `/common/enums/${RESULT_CODE_ENUM_NAME}`,
          method: "get",
          noAuth: true,
          headers: {
            "X-Skip-Message": "1",
            "X-Skip-Result-Code": "1",
          },
        })
      )
      .then((response) => {
        const res = response.data ?? {};
        const map = new Map();
        collectEnumItems(res.data).forEach((item) => {
          const code = item?.code ?? item?.value ?? item?.key;
          const label =
            item?.message ?? item?.label ?? item?.name ?? item?.desc ?? item?.description;
          if (code !== undefined && label) {
            map.set(String(code), String(label));
          }
        });
        return map;
      })
      .catch(() => new Map());
  }

  return resultCodePromise;
}

async function resolveResponseMessage(res, skipResultCode) {
  const rawMessage = typeof res?.message === "string" ? res.message.trim() : "";
  if (rawMessage) {
    return rawMessage;
  }

  if (!skipResultCode) {
    const codeMap = await loadResultCodeMap();
    const enumMessage = codeMap.get(String(res?.code));
    if (enumMessage) {
      return enumMessage;
    }
  }

  return Number(res?.code) === SUCCESS_CODE
    ? DEFAULT_SUCCESS_MESSAGE
    : DEFAULT_ERROR_MESSAGE;
}

function isAuthInvalidByCode(code) {
  return [401, 1001, 1002, 1003, 1004, 1005, 1006, 1007].includes(Number(code));
}

function isAuthInvalidByMessage(message) {
  return /(token|未登录|登录失效|登录状态|会话未登录|会话失效|重新登录)/i.test(
    String(message || "")
  );
}

function isAuthInvalid(resOrMessage) {
  if (typeof resOrMessage === "string") {
    return isAuthInvalidByMessage(resOrMessage);
  }

  return (
    isAuthInvalidByCode(resOrMessage?.code) ||
    isAuthInvalidByMessage(resOrMessage?.message)
  );
}

function redirectToLogin(message = LOGIN_EXPIRED_MESSAGE) {
  clearAuthSession();

  if (redirecting || router.currentRoute.value.path === "/login") {
    return;
  }

  redirecting = true;
  ElMessage.warning(message);
  router.replace("/login").finally(() => {
    redirecting = false;
  });
}

service.interceptors.request.use(
  (config) => attachAuthHeaders(config),
  (error) => Promise.reject(error)
);

service.interceptors.response.use(
  async (response) => {
    const res = response.data ?? {};
    const headers = normalizeHeaders(response.config?.headers);
    const skipMessage = String(headers["X-Skip-Message"] || "") === "1";
    const skipResultCode =
      String(headers["X-Skip-Result-Code"] || "") === "1" ||
      String(response.config?.url || "").includes(`/common/enums/${RESULT_CODE_ENUM_NAME}`);
    const message = await resolveResponseMessage(res, skipResultCode);

    if (isAuthInvalid(res)) {
      redirectToLogin(message);
      const error = new Error(message);
      error.response = res;
      throw error;
    }

    if (!skipMessage) {
      notify(message, Number(res?.code) === SUCCESS_CODE ? "success" : "error");
    }

    if (Number(res?.code) === SUCCESS_CODE) {
      return res;
    }

    const error = new Error(message);
    error.response = res;
    throw error;
  },
  (error) => {
    if (error?.code === "ECONNABORTED") {
      ElMessage.error("请求超时");
      return Promise.reject(error);
    }

    const responseStatus = Number(error?.response?.status);
    const responseData = error?.response?.data;
    const message =
      responseData?.message || error?.message || DEFAULT_ERROR_MESSAGE;

    if (isAuthInvalidByCode(responseStatus) || isAuthInvalid(responseData) || isAuthInvalid(message)) {
      redirectToLogin(typeof message === "string" && message.trim() ? message : LOGIN_EXPIRED_MESSAGE);
      return Promise.reject(error);
    }

    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export function request(config = {}) {
  return service.request(attachAuthHeaders(config));
}

function buildConfig(method, url, payload, config = {}) {
  const nextConfig = { ...config, url, method };

  if (method === "get" || method === "delete") {
    nextConfig.params = payload;
  } else {
    nextConfig.data = payload;
  }

  return nextConfig;
}

export const http = {
  get(url, params, config) {
    return request(buildConfig("get", url, params, config));
  },
  post(url, data, config) {
    return request(buildConfig("post", url, data, config));
  },
  put(url, data, config) {
    return request(buildConfig("put", url, data, config));
  },
  delete(url, params, config) {
    return request(buildConfig("delete", url, params, config));
  },
};

syncDefaultAuthHeaders();

export default request;

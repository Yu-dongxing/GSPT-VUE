import axios from "axios";
import { ElMessage } from "element-plus";
import router from "../router";

const DEFAULT_TIMEOUT = 15000;
const SUCCESS_CODE = 200;
export const TOKEN_KEY = "Authorization";
const THEME_KEY = "gspt-theme";
const DEFAULT_SUCCESS_MESSAGE = "操作成功";
const DEFAULT_ERROR_MESSAGE = "请求失败";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8080/api";

const service = axios.create({
  baseURL,
  timeout: DEFAULT_TIMEOUT,
});

let resultCodePromise = null;
let redirecting = false;

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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
      .get("/common/enums/ResultCode", {
        headers: {
          "X-Skip-Message": "1",
          "X-Skip-Result-Code": "1",
        },
      })
      .then((response) => {
        const res = response.data ?? {};
        const items = collectEnumItems(res.data);
        const map = new Map();
        items.forEach((item) => {
          const code = item?.code ?? item?.value ?? item?.key;
          const label =
            item?.message ?? item?.label ?? item?.name ?? item?.desc ?? item?.description;
          if (code !== undefined && label) {
            map.set(String(code), label);
          }
        });
        return map;
      })
      .catch(() => new Map());
  }

  return resultCodePromise;
}

async function resolveMessage(res, skipResultCode) {
  if (typeof res?.message === "string" && res.message.trim()) {
    return res.message.trim();
  }

  if (!skipResultCode) {
    const codeMap = await loadResultCodeMap();
    const codeText = codeMap.get(String(res?.code));
    if (codeText) {
      return codeText;
    }
  }

  return res?.code === SUCCESS_CODE ? DEFAULT_SUCCESS_MESSAGE : DEFAULT_ERROR_MESSAGE;
}

function isAuthInvalid(resOrMessage) {
  const code = Number(resOrMessage?.code);
  const message =
    typeof resOrMessage === "string"
      ? resOrMessage
      : String(resOrMessage?.message || "");

  return (
    [400, 401, 403].includes(code) ||
    /token|登录|认证|失效|未登录|鉴权/i.test(message)
  );
}

function redirectToLogin(message = "登录状态已失效，请重新登录") {
  clearToken();

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
  (config) => {
    const token = getToken();
    if (token) {
      config.headers[TOKEN_KEY] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

service.interceptors.response.use(
  async (response) => {
    const res = response.data ?? {};
    const skipMessage = response.config?.headers?.["X-Skip-Message"] === "1";
    const skipResultCode =
      response.config?.headers?.["X-Skip-Result-Code"] === "1" ||
      String(response.config?.url || "").includes("/common/enums/ResultCode");
    const message = await resolveMessage(res, skipResultCode);

    if (isAuthInvalid(res)) {
      redirectToLogin(message);
      const error = new Error(message);
      error.response = res;
      return Promise.reject(error);
    }

    if (!skipMessage) {
      notify(message, res.code === SUCCESS_CODE ? "success" : "error");
    }

    if (res.code === SUCCESS_CODE) {
      return res;
    }

    const error = new Error(message);
    error.response = res;
    return Promise.reject(error);
  },
  (error) => {
    if (error?.code === "ECONNABORTED") {
      ElMessage.error("请求超时");
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    if ([401, 403].includes(status)) {
      redirectToLogin();
      return Promise.reject(error);
    }

    const serverMessage =
      error?.response?.data?.message || error?.message || DEFAULT_ERROR_MESSAGE;
    if (!isAuthInvalid(serverMessage)) {
      ElMessage.error(serverMessage);
    }
    return Promise.reject(error);
  }
);

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

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

export function setStoredTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function request(config) {
  return service(config);
}

export const http = {
  get(url, params, config) {
    return service({ url, method: "get", params, ...config });
  },
  post(url, data, config) {
    return service({ url, method: "post", data, ...config });
  },
  put(url, data, config) {
    return service({ url, method: "put", data, ...config });
  },
  delete(url, params, config) {
    return service({ url, method: "delete", params, ...config });
  },
};

export default request;

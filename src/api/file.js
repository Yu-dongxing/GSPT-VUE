import { http, request } from "../utils/request";

export function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request({
    url: "/file/upload",
    method: "post",
    data: formData,
  });
}

// User file APIs
export function getMyFilePage(data) {
  return http.post("/file/my/page", data);
}

export function deleteMyFile(fileId) {
  return http.get(`/file/my/delete/${fileId}`);
}

export function batchDeleteMyFiles(fileIds) {
  return request({
    url: "/file/my/delete/batch",
    method: "get",
    params: {
      fileIds,
    },
  });
}
// @ 未知者科技 
// Admin file APIs
export function getAdminFilePage(data) {
  return http.post("/admin/file/page", data);
}

export function deleteAdminFile(fileId) {
  return http.get(`/admin/file/delete/${fileId}`);
}

export function batchDeleteAdminFiles(fileIds) {
  return request({
    url: "/admin/file/delete/batch",
    method: "post",
    data: {
      fileIds,
    },
  });
}

import { http, request } from "../utils/request";

// User frontend APIs
export function registerNormalUser(data) {
  return http.post("/user/register/normal", data, { noAuth: true });
}

export function registerEnterpriseUser(data) {
  return http.post("/user/register/enterprise", data, { noAuth: true });
}

export function loginUser(data) {
  return http.post("/user/login", data, { noAuth: true });
}

export function loginAdmin(data) {
  return http.post("/admin/user/login", data, { noAuth: true });
}

export function logout() {
  return http.post("/user/logout");
}

export function getCurrentUser() {
  return http.get("/user/current");
}

export function updateCurrentUserProfile(data) {
  return http.post("/user/profile/update", data);
}

export function changeCurrentUserPassword(data) {
  return http.post("/user/password/change", data);
}

// Admin user management APIs
export function getAdminUserPage(data) {
  return http.post("/admin/user/page", data);
}

export function getAdminUserDetail(userId) {
  return http.get(`/admin/user/${userId}`);
}

export function addAdminUser(data) {
  return http.post("/admin/user/add", data);
}

export function updateAdminUser(data) {
  return http.post("/admin/user/update", data);
}

export function auditEnterpriseUser(data) {
  return http.post("/admin/user/audit/enterprise", data);
}

export function deleteAdminUser(userId) {
  return http.get(`/admin/user/delete/${userId}`);
}

export function batchDeleteAdminUsers(userIds) {
  return request({
    url: "/admin/user/delete/batch",
    method: "get",
    params: {
      userIds,
    },
  });
}

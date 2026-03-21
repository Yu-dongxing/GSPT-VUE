import { http, request } from "../utils/request";
// @ 未知者科技 
// User article APIs
export function publishArticle(data) {
  return http.post("/article/publish", data);
}

export function updateMyArticle(data) {
  return http.post("/article/my/update", data);
}

export function getMyArticlePage(data) {
  return http.post("/article/my/page", data);
}

export function getMyArticleDetail(articleId) {
  return http.get(`/article/my/${articleId}`);
}

export function deleteMyArticle(articleId) {
  return http.get(`/article/my/delete/${articleId}`);
}

export function batchDeleteMyArticles(articleIds) {
  return request({
    url: "/article/my/delete/batch",
    method: "get",
    params: {
      articleIds,
    },
  });
}

// Admin article APIs
export function getAdminArticlePage(data) {
  return http.post("/admin/article/page", data);
}

export function getAdminArticleDetail(articleId) {
  return http.get(`/admin/article/info/${articleId}`);
}

export function addAdminArticle(data) {
  return http.post("/admin/article/add", data);
}

export function updateAdminArticle(data) {
  return http.post("/admin/article/update", data);
}

export function saveAdminArticleImageWall(data) {
  return http.post("/admin/article/image-wall/save", data);
}

export function updateAdminArticleImageWall(data) {
  return http.post("/admin/article/image-wall/update", data);
}

export function deleteAdminArticle(articleId) {
  return http.get(`/admin/article/delete/${articleId}`);
}

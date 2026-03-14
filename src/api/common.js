import { http } from "../utils/request";

const enumCache = new Map();

export function getEnumByName(enumName) {
  if (!enumCache.has(enumName)) {
    enumCache.set(enumName, http.get(`/common/enums/${enumName}`));
  }

  return enumCache.get(enumName);
}

export function getAllEnums() {
  return http.get("/common/enums/all");
}

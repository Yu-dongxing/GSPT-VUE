export function normalizeEnumOptions(payload, fallbackOptions = []) {
  const entries = collectEnumEntries(payload);
  if (!entries.length) {
    return fallbackOptions;
  }

  return entries.map((item) => ({
    label:
      item.label ??
      item.message ??
      item.desc ??
      item.description ??
      item.name ??
      String(item.value ?? item.key ?? ""),
    value: item.value ?? item.code ?? item.key ?? item.enumCode ?? item.label,
  }));
}

function collectEnumEntries(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload.filter((item) => item && typeof item === "object");
  }

  if (typeof payload === "object") {
    return Object.values(payload).flatMap((value) => collectEnumEntries(value));
  }

  return [];
}

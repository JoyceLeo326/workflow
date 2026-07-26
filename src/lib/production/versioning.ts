import type { ProductionDocument, ProductionVersion } from "./types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function versionId() {
  return `version-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export function saveProductionVersion(
  current: ProductionDocument,
  history: ProductionVersion[],
  label: string,
  now = new Date().toISOString(),
) {
  const highestVersion = Math.max(current.version, ...history.map((item) => item.version), 0);
  const document: ProductionDocument = {
    ...clone(current),
    version: highestVersion + 1,
    updatedAt: now,
  };
  const snapshot: ProductionVersion = {
    id: versionId(),
    version: document.version,
    label: label.trim() || `版本 ${document.version}`,
    createdAt: now,
    document: clone(document),
  };
  return {
    document,
    history: [...history.map(clone), snapshot],
  };
}

export function restoreProductionVersion(
  history: ProductionVersion[],
  versionIdToRestore: string,
  now = new Date().toISOString(),
) {
  const selected = history.find((item) => item.id === versionIdToRestore);
  if (!selected) throw new Error("PRODUCTION_VERSION_NOT_FOUND");
  return saveProductionVersion(
    selected.document,
    history,
    `恢复 · ${selected.label}`,
    now,
  );
}

export function hasEnoughFreeSpace(freeSpace: number | null, requiredBytes: number) {
  if (freeSpace === null) {
    return true;
  }

  return freeSpace >= requiredBytes;
}

export function getStorageUsagePercent(freeSpace: number | null, requiredBytes: number) {
  if (freeSpace === null) {
    return 0;
  }

  if (freeSpace <= 0) {
    return requiredBytes > 0 ? 100 : 0;
  }

  return Math.min(100, Math.round((requiredBytes / freeSpace) * 100));
}

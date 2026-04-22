import type { ContentItem, ContentType } from '../types';

export const CONTENT_TYPE_FOLDER_MAP: Record<ContentType, string> = {
  avatar_item: '00009000',
  theme: '00030000',
  dlc: '00000002',
  gamerpic: '00020000',
  demo: '000D0000',
  title_update: '000B0000',
  xbla: '00070000',
  god: '00080000',
};

export const DEFAULT_TITLE_IDS: Partial<Record<ContentType, string>> = {
  avatar_item: 'FFED0707',
  theme: 'FFFE07D1',
  gamerpic: 'FFFE07D1',
};

const PROFILE_SCOPED_TYPES = new Set<ContentType>([
  'avatar_item',
  'theme',
  'gamerpic',
]);

const RESERVED_CONTENT_IDS = new Set([
  '00000000',
  '00000002',
  '00009000',
  '00030000',
  '00020000',
  '000D0000',
  '000B0000',
  '00070000',
  '00080000',
]);

export function isLikelyTitleId(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.toUpperCase();
  return /^[0-9A-F]{8}$/.test(normalized) && !RESERVED_CONTENT_IDS.has(normalized);
}

export function isLikelyProfileId(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.toUpperCase();
  return /^[0-9A-F]{16}$/.test(normalized) && normalized !== '0000000000000000';
}

export function resolveTitleId(titleId: string | undefined, type: ContentType): string {
  if (isLikelyTitleId(titleId)) {
    return titleId!.toUpperCase();
  }

  return DEFAULT_TITLE_IDS[type] || '00000000';
}

export function resolveContentOwnerId(
  item: Pick<ContentItem, 'type' | 'metadata'>,
  preferredProfileId?: string,
): string {
  if (PROFILE_SCOPED_TYPES.has(item.type)) {
    if (isLikelyProfileId(preferredProfileId)) {
      return preferredProfileId!.toUpperCase();
    }

    if (isLikelyProfileId(item.metadata?.technical?.profileId)) {
      return item.metadata.technical!.profileId.toUpperCase();
    }
  }

  return '0000000000000000';
}

export function buildContentRelativePath(
  item: Pick<ContentItem, 'type' | 'fileName' | 'metadata'>,
  options: { contentOwnerId?: string } = {},
): string {
  const titleId = resolveTitleId(item.metadata?.titleId, item.type);
  const typeFolder = CONTENT_TYPE_FOLDER_MAP[item.type] || '00000001';
  const contentOwnerId = resolveContentOwnerId(item, options.contentOwnerId);
  return ['Content', contentOwnerId, titleId, typeFolder, item.fileName].join('/');
}

export function buildInstalledContentKey(item: Pick<ContentItem, 'type' | 'fileName' | 'size' | 'metadata'>): string {
  const titleId = resolveTitleId(item.metadata?.titleId, item.type);
  const typeFolder = CONTENT_TYPE_FOLDER_MAP[item.type] || '00000001';
  return `${titleId}/${typeFolder}/${item.fileName}_${item.size}`;
}

export function buildInstalledContentKeyFromPathParts(parts: string[], size: number): string | null {
  const normalizedParts = parts.map((part) => part.toUpperCase());
  const fileName = parts.at(-1);
  const typeFolder = normalizedParts.at(-2);
  const titleId = normalizedParts.at(-3);

  if (!fileName || !typeFolder || !titleId) {
    return null;
  }

  return `${titleId}/${typeFolder}/${fileName}_${size}`;
}

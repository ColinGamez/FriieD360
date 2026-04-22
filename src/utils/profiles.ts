import { AppSettings, ContentItem } from '../types';

type ProfileContext = Pick<AppSettings, 'profileId' | 'profileMappings'>;

export function getAvailableProfileIds(settings: ProfileContext, items: ContentItem[]) {
  return Array.from(new Set([
    '0000000000000000',
    settings.profileId || '0000000000000000',
    ...Object.keys(settings.profileMappings || {}),
    ...items
      .map((item) => item.metadata.technical?.profileId)
      .filter((id): id is string => Boolean(id) && id !== '0000000000000000'),
  ])).filter(Boolean);
}

export function getProfileLabel(profileId: string, profileMappings?: Record<string, string>) {
  return profileId === '0000000000000000'
    ? 'Global / All Profiles'
    : `${profileMappings?.[profileId] || 'Xbox Profile'} (${profileId})`;
}

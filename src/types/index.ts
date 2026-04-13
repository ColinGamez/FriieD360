export type ViewID = 'dashboard' | 'avatar' | 'themes' | 'staging' | 'activity' | 'settings' | 'repair' | 'collections' | 'usb_export';

export type ContentType = 'avatar_item' | 'theme';

export interface ItemMetadata {
  titleId: string;
  gameName: string;
  category: string;
  tags: string[];
}

export interface ContentItem {
  id: string;
  name: string;
  fileName: string;
  extension: string;
  fullPath: string;
  parentFolder: string;
  size: number;
  type: ContentType;
  isExtensionless: boolean;
  isFavorite: boolean;
  isStaged: boolean;
  dateModified: string;
  isValid: boolean;
  format: string;
  metadata: ItemMetadata;
  isInstalled?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  itemIds: string[];
  color?: string;
}

export interface AppSettings {
  sourceFolders: string[];
  outputFolder: string;
  profileId?: string;
  theme: 'dark';
  scanOnStartup: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: string;
}

export interface ScanProgress {
  total: number;
  current: number;
  folder: string;
  isScanning: boolean;
}

export type ViewID = 'dashboard' | 'avatar' | 'themes' | 'dlc' | 'gamerpics' | 'games' | 'staging' | 'activity' | 'settings' | 'repair' | 'collections' | 'usb_export' | 'library' | 'profiles';

export type ContentType = 'avatar_item' | 'theme' | 'dlc' | 'gamerpic' | 'xbla' | 'god' | 'demo' | 'title_update';
export type AppTheme = 'carbon' | 'blades' | 'metro';

export interface ItemMetadata {
  titleId: string;
  gameName: string;
  category: string;
  tags: string[];
  coverUrl?: string;
  description?: string;
  technical?: {
    profileId: string;
    consoleId: string;
    deviceId: string;
    mediaId?: string;
  };
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
  theme: AppTheme;
  scanOnStartup: boolean;
  autoRepair: boolean;
  customMappings: Record<string, string>;
  profileMappings?: Record<string, string>;
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

export interface PathValidationResult {
  exists: boolean;
  isDirectory: boolean;
}

export interface CopyOperationResult {
  source: string;
  dest: string;
  fileName: string;
  status: 'pending' | 'success' | 'skipped' | 'error';
  error?: string;
}

export interface RepairOperationResult {
  id: string;
  originalPath: string;
  newPath: string;
  fileName: string;
  newFileName: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

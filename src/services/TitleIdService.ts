import { getTitleCatalog, getTitleInfo, searchTitleCatalog } from '../data/titleCatalog';

export type { TitleInfo } from '../data/titleCatalog';

export class TitleIdService {
  static search(query: string) {
    return searchTitleCatalog(query);
  }

  static getById(id: string) {
    return getTitleInfo(id) || undefined;
  }

  static getAll() {
    return getTitleCatalog();
  }
}

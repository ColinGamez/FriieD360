import { ItemMetadata } from '../types';
import { getTitleInfo } from '../data/titleCatalog';
import { isLikelyTitleId } from '../utils/contentPaths';

export class MetadataService {
  private static coverTitleLines(title: string) {
    const words = title.replace(/\s+/g, ' ').trim().split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;
      if (nextLine.length <= 16 || currentLine.length === 0) {
        currentLine = nextLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }

      if (lines.length === 2) {
        break;
      }
    }

    if (currentLine && lines.length < 2) {
      lines.push(currentLine);
    }

    return lines.slice(0, 2).map((line) => (line.length > 18 ? `${line.slice(0, 15)}...` : line));
  }

  private static coverPalette(seed: string) {
    const palettes = [
      ['#0F7C10', '#052806', '#B8FFB8'],
      ['#0A4A7C', '#061B2B', '#A8D8FF'],
      ['#7C3B0A', '#2B1406', '#FFD1A8'],
      ['#5C2D91', '#1E1030', '#E0CBFF'],
      ['#7C0F37', '#2B0612', '#FFC4D7'],
      ['#0A6F6C', '#072221', '#B7FFFB'],
    ];

    const seedValue = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palettes[seedValue % palettes.length];
  }

  static getTitleInfo(titleId: string) {
    return getTitleInfo(titleId);
  }

  private static getPathMatchTitleInfo(fullPath: string, titleId: string) {
    if (!titleId || titleId === 'Unknown') {
      return null;
    }

    const normalizedTitleId = titleId.toUpperCase();
    const pathParts = fullPath.split(/[\\/]/);

    for (const part of pathParts) {
      const match = part.match(/^(.*?)\s*\(([0-9A-Fa-f]{8})\)$/);
      if (!match) {
        continue;
      }

      if (match[2].toUpperCase() !== normalizedTitleId) {
        continue;
      }

      const name = match[1].trim();
      if (!name) {
        continue;
      }

      return {
        name,
        franchise: name,
      };
    }

    return null;
  }

  static deriveMetadata(fullPath: string, fileName: string, customMappings: Record<string, string> = {}): ItemMetadata {
    const pathParts = fullPath.split(/[\\/]/);
    let titleId = 'Unknown';

    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      if (isLikelyTitleId(part)) {
        titleId = part.toUpperCase();
        break;
      }
    }

    if (titleId === 'Unknown') {
      const titleIdMatch = fullPath.match(/[0-9A-Fa-f]{8}/g);
      titleId = titleIdMatch?.find((id) => isLikelyTitleId(id)) || 'Unknown';
    }

    const upperTitleId = titleId.toUpperCase();
    const info = this.getTitleInfo(upperTitleId);
    const pathMatchInfo = this.getPathMatchTitleInfo(fullPath, upperTitleId);
    const customName = customMappings[upperTitleId];
    const displayName = customName || info?.name || pathMatchInfo?.name;
    const category = info?.franchise || pathMatchInfo?.franchise || displayName || 'Other';

    const tags: string[] = [];
    if (fullPath.toLowerCase().includes('official')) tags.push('Official');
    if (fullPath.toLowerCase().includes('mod') || fullPath.toLowerCase().includes('custom')) tags.push('Custom');

    return {
      titleId,
      gameName: displayName || 'Unknown Game',
      category,
      tags,
      coverUrl: this.getCoverArtUrl(upperTitleId, displayName, category),
      description: displayName
        ? `${displayName}${category && category !== displayName ? ` • ${category}` : ''}`
        : undefined,
    };
  }

  static async simulateOnlineFetch(titleId: string): Promise<any> {
    const upperTitleId = titleId.toUpperCase();
    if (!isLikelyTitleId(upperTitleId)) {
      return null;
    }

    const info = this.getTitleInfo(upperTitleId);

    if (info) {
      return {
        gameName: info.name,
        category: info.franchise,
        tags: ['Title Match', 'Local Database'],
        description: `${info.name} matched from the built-in Xbox 360 title database.`,
        coverUrl: this.getCoverArtUrl(upperTitleId, info.name, info.franchise),
      };
    }

    return {
      tags: ['Title ID Only'],
      description: `Generated a local cover card for Title ID ${upperTitleId}.`,
      coverUrl: this.getCoverArtUrl(upperTitleId),
    };
  }

  static getCoverArtUrl(titleId: string, gameName?: string, franchise?: string): string {
    if (!titleId || titleId === 'Unknown') return '';

    const params = new URLSearchParams();
    if (gameName) params.set('name', gameName);
    if (franchise) params.set('franchise', franchise);

    const query = params.toString();
    return `/api/cover-art/${encodeURIComponent(titleId.toUpperCase())}${query ? `?${query}` : ''}`;
  }

  static renderCoverArtSvg(titleId: string, gameName?: string, franchise?: string): string {
    const upperTitleId = titleId.toUpperCase();
    const info = this.getTitleInfo(upperTitleId);
    const resolvedGameName = gameName || info?.name || `Title ${upperTitleId}`;
    const resolvedFranchise = franchise || info?.franchise || 'Xbox 360';
    const [primary, secondary, accent] = this.coverPalette(upperTitleId);
    const titleLines = this.coverTitleLines(resolvedGameName);

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900" role="img" aria-label="${resolvedGameName}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
        </defs>
        <rect width="600" height="900" fill="url(#bg)" rx="32" />
        <circle cx="470" cy="160" r="180" fill="${accent}" opacity="0.08" />
        <circle cx="120" cy="740" r="150" fill="#FFFFFF" opacity="0.06" />
        <rect x="44" y="44" width="512" height="812" rx="28" fill="none" stroke="rgba(255,255,255,0.15)" />
        <text x="60" y="92" fill="#F4FFF4" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="4">XBOX 360</text>
        <text x="60" y="148" fill="${accent}" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="6">${resolvedFranchise.toUpperCase()}</text>
        <text x="60" y="560" fill="#FFFFFF" font-family="Segoe UI, Arial, sans-serif" font-size="72" font-weight="800">
          <tspan x="60" dy="0">${titleLines[0] || upperTitleId}</tspan>
          ${titleLines[1] ? `<tspan x="60" dy="78">${titleLines[1]}</tspan>` : ''}
        </text>
        <text x="60" y="804" fill="rgba(255,255,255,0.85)" font-family="Consolas, monospace" font-size="28" font-weight="700">${upperTitleId}</text>
        <text x="60" y="844" fill="rgba(255,255,255,0.55)" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="600">Generated locally by FriieD360</text>
      </svg>
    `.trim();
  }
}

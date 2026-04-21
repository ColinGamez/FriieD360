import { ItemMetadata } from '../types';
import { isLikelyTitleId } from '../utils/contentPaths';

export class MetadataService {
  private static TITLE_MAP: Record<string, { name: string, franchise: string }> = {
    '584111F7': { name: 'Forza Horizon 2', franchise: 'Forza' },
    '4D53084D': { name: 'Forza Motorsport 3', franchise: 'Forza' },
    '4D530917': { name: 'Forza Motorsport 4', franchise: 'Forza' },
    '4D5307E1': { name: 'Gears of War', franchise: 'Gears of War' },
    '4D53082D': { name: 'Gears of War 2', franchise: 'Gears of War' },
    '4D5308AB': { name: 'Gears of War 3', franchise: 'Gears of War' },
    '4D530A26': { name: 'Gears of War: Judgment', franchise: 'Gears of War' },
    '4D5307E6': { name: 'Halo 3', franchise: 'Halo' },
    '4D53085B': { name: 'Halo: Reach', franchise: 'Halo' },
    '4D530919': { name: 'Halo 4', franchise: 'Halo' },
    '4D530877': { name: 'Halo: Combat Evolved Anniversary', franchise: 'Halo' },
    '4D530808': { name: 'Halo 3: ODST', franchise: 'Halo' },
    '4D530871': { name: 'Halo Wars', franchise: 'Halo' },
    '41560817': { name: 'Modern Warfare 2', franchise: 'Call of Duty' },
    '41560855': { name: 'Black Ops', franchise: 'Call of Duty' },
    '415608CB': { name: 'Modern Warfare 3', franchise: 'Call of Duty' },
    '415608C3': { name: 'Black Ops II', franchise: 'Call of Duty' },
    '4156081C': { name: 'World at War', franchise: 'Call of Duty' },
    '415607E6': { name: 'Call of Duty 4: MW', franchise: 'Call of Duty' },
    '415608FC': { name: 'Call of Duty: Ghosts', franchise: 'Call of Duty' },
    '41560914': { name: 'Advanced Warfare', franchise: 'Call of Duty' },
    '4541088F': { name: 'Battlefield 3', franchise: 'Battlefield' },
    '45410950': { name: 'Battlefield 4', franchise: 'Battlefield' },
    '454108A6': { name: 'Battlefield: Bad Company 2', franchise: 'Battlefield' },
    '5454082B': { name: 'Red Dead Redemption', franchise: 'Red Dead' },
    '545408A7': { name: 'Grand Theft Auto V', franchise: 'GTA' },
    '54540825': { name: 'Grand Theft Auto IV', franchise: 'GTA' },
    '425307D1': { name: 'Skyrim', franchise: 'Elder Scrolls' },
    '425307D5': { name: 'Fallout 3', franchise: 'Fallout' },
    '425307E6': { name: 'Fallout: New Vegas', franchise: 'Fallout' },
    '58410A5A': { name: 'Minecraft', franchise: 'Minecraft' },
    '4D5307D5': { name: 'Mass Effect', franchise: 'Mass Effect' },
    '425607E1': { name: 'Mass Effect 2', franchise: 'Mass Effect' },
    '425607E3': { name: 'Mass Effect 3', franchise: 'Mass Effect' },
    '53450817': { name: 'Dead Space', franchise: 'Dead Space' },
    '5345083C': { name: 'Dead Space 2', franchise: 'Dead Space' },
    '5345085C': { name: 'Dead Space 3', franchise: 'Dead Space' },
    '55530812': { name: 'Saints Row: The Third', franchise: 'Saints Row' },
    '555308D4': { name: 'Saints Row IV', franchise: 'Saints Row' },
    '425607E5': { name: 'Dragon Age: Origins', franchise: 'Dragon Age' },
    '425607E8': { name: 'Dragon Age II', franchise: 'Dragon Age' },
    '42560801': { name: 'Dragon Age: Inquisition', franchise: 'Dragon Age' },
    '58410824': { name: 'Castle Crashers', franchise: 'Arcade' },
    '5841095A': { name: 'Trials HD', franchise: 'Arcade' },
    '58410A47': { name: 'Limbo', franchise: 'Arcade' },
    '5841125A': { name: 'State of Decay', franchise: 'Arcade' },
    '58410954': { name: 'Shadow Complex', franchise: 'Arcade' },
    '5841090B': { name: 'BattleBlock Theater', franchise: 'Arcade' },
    '58410B3A': { name: 'Bastion', franchise: 'Arcade' },
    '58410903': { name: 'Braid', franchise: 'Arcade' },
    '58410846': { name: 'Portal: Still Alive', franchise: 'Portal' },
    '4541080F': { name: 'Mirror\'s Edge', franchise: 'Mirror\'s Edge' },
    '4D530910': { name: 'Kinect Sports', franchise: 'Kinect' },
    '4D530858': { name: 'Alan Wake', franchise: 'Alan Wake' },
    '584108A1': { name: 'Left 4 Dead', franchise: 'Left 4 Dead' },
    '58410912': { name: 'Left 4 Dead 2', franchise: 'Left 4 Dead' },
    '4D5307D1': { name: 'Crackdown', franchise: 'Crackdown' },
    '4D5308BC': { name: 'Crackdown 2', franchise: 'Crackdown' },
    '4D53081D': { name: 'Fable II', franchise: 'Fable' },
    '4D5308D6': { name: 'Fable III', franchise: 'Fable' },
    '545407F2': { name: 'Borderlands', franchise: 'Borderlands' },
    '5454087C': { name: 'Borderlands 2', franchise: 'Borderlands' },
    '545408E5': { name: 'BioShock', franchise: 'BioShock' },
    '54540850': { name: 'BioShock 2', franchise: 'BioShock' },
    '545408CF': { name: 'BioShock Infinite', franchise: 'BioShock' },
    '4B4E0805': { name: 'Ninja Gaiden II', franchise: 'Ninja Gaiden' },
    '4B4E082F': { name: 'Ninja Gaiden 3', franchise: 'Ninja Gaiden' },
    '434307D4': { name: 'Devil May Cry 4', franchise: 'DMC' },
    '43430824': { name: 'DmC: Devil May Cry', franchise: 'DMC' },
    '53450802': { name: 'Army of Two', franchise: 'Army of Two' },
    '5345084F': { name: 'Army of Two: The 40th Day', franchise: 'Army of Two' },
    '5345085D': { name: 'Army of Two: The Devil\'s Cartel', franchise: 'Army of Two' },
    '555307D5': { name: 'Saints Row', franchise: 'Saints Row' },
    '5553081C': { name: 'Saints Row 2', franchise: 'Saints Row' },
    '54540818': { name: 'Mafia II', franchise: 'Mafia' },
    '545408B8': { name: 'Max Payne 3', franchise: 'Max Payne' },
    '5454082D': { name: 'L.A. Noire', franchise: 'Rockstar' },
    '4D5307E8': { name: 'Mass Effect', franchise: 'Mass Effect' },
    'FFED0707': { name: 'Avatar Asset', franchise: 'System' },
    'FFFE07D1': { name: 'Xbox Dashboard', franchise: 'System' },
  };

  static deriveMetadata(fullPath: string, fileName: string, customMappings: Record<string, string> = {}): ItemMetadata {
    // Look for 8-character hex strings that are likely Title IDs
    // We prioritize IDs found in the path structure (e.g. /Content/.../TITLEID/...)
    const pathParts = fullPath.split(/[\\/]/);
    let titleId = 'Unknown';
    
    // Check if any path part looks like a Title ID (8 hex chars)
    // We iterate backwards to find the most specific one
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      if (isLikelyTitleId(part)) {
        titleId = part.toUpperCase();
        break;
      }
    }

    // Fallback to general regex if not found in path parts
    if (titleId === 'Unknown') {
      const titleIdMatch = fullPath.match(/[0-9A-Fa-f]{8}/g);
      titleId = titleIdMatch?.find((id) => isLikelyTitleId(id)) || 'Unknown';
    }

    const upperTitleId = titleId.toUpperCase();
    const info = this.TITLE_MAP[upperTitleId];
    const customName = customMappings[upperTitleId];

    const tags: string[] = [];
    if (fullPath.toLowerCase().includes('official')) tags.push('Official');
    if (fullPath.toLowerCase().includes('mod') || fullPath.toLowerCase().includes('custom')) tags.push('Custom');
    
    return {
      titleId,
      gameName: customName || info?.name || 'Unknown Game',
      category: info?.franchise || 'Other',
      tags: tags,
      coverUrl: this.getCoverArtUrl(titleId)
    };
  }

  static async simulateOnlineFetch(titleId: string): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const upperTitleId = titleId.toUpperCase();
    const info = this.TITLE_MAP[upperTitleId];
    
    if (info) {
      return {
        gameName: info.name,
        category: info.franchise,
        tags: ['Online Verified']
      };
    }
    
    return null;
  }

  static getCoverArtUrl(titleId: string): string {
    if (!titleId || titleId === 'Unknown') return '';
    // Use picsum as a placeholder, using titleId as seed for consistency
    return `https://picsum.photos/seed/${titleId}/300/450`;
  }
}

import { XBOX_360_TITLE_DB_RAW } from './titleCatalog.generated';

export interface TitleInfo {
  id: string;
  name: string;
  franchise: string;
  releaseYear?: number;
  aliases?: string[];
}

const TITLE_OVERRIDES: Record<string, Omit<TitleInfo, 'id'>> = {
  '584111F7': { name: 'Minecraft: Xbox 360 Edition', franchise: 'Minecraft', releaseYear: 2012 },
  '4D53084D': { name: 'Forza Motorsport 3', franchise: 'Forza', releaseYear: 2009 },
  '4D530917': { name: 'Forza Motorsport 4', franchise: 'Forza', releaseYear: 2011 },
  '4D5307E1': { name: 'Gears of War', franchise: 'Gears of War', releaseYear: 2006 },
  '4D53082D': { name: 'Gears of War 2', franchise: 'Gears of War', releaseYear: 2008 },
  '4D5308AB': { name: 'Gears of War 3', franchise: 'Gears of War', releaseYear: 2011 },
  '4D530A26': { name: 'Gears of War: Judgment', franchise: 'Gears of War', releaseYear: 2013 },
  '4D5307E6': { name: 'Halo 3', franchise: 'Halo', releaseYear: 2007 },
  '4D53085B': { name: 'Halo: Reach', franchise: 'Halo', releaseYear: 2010 },
  '4D530919': { name: 'Halo 4', franchise: 'Halo', releaseYear: 2012 },
  '4D530877': { name: 'Halo: Combat Evolved Anniversary', franchise: 'Halo', releaseYear: 2011 },
  '4D530808': { name: 'Halo 3: ODST', franchise: 'Halo', releaseYear: 2009 },
  '4D530871': { name: 'Halo Wars', franchise: 'Halo', releaseYear: 2009 },
  '41560817': { name: 'Call of Duty: Modern Warfare 2', franchise: 'Call of Duty', releaseYear: 2009 },
  '41560855': { name: 'Call of Duty: Black Ops', franchise: 'Call of Duty', releaseYear: 2010 },
  '415608CB': { name: 'Call of Duty: Modern Warfare 3', franchise: 'Call of Duty', releaseYear: 2011 },
  '415608C3': { name: 'Call of Duty: Black Ops II', franchise: 'Call of Duty', releaseYear: 2012 },
  '4156081C': { name: 'Call of Duty: World at War', franchise: 'Call of Duty', releaseYear: 2008 },
  '415607E6': { name: 'Call of Duty 4: Modern Warfare', franchise: 'Call of Duty', releaseYear: 2007 },
  '415608FC': { name: 'Call of Duty: Ghosts', franchise: 'Call of Duty', releaseYear: 2013 },
  '41560914': { name: 'Call of Duty: Advanced Warfare', franchise: 'Call of Duty', releaseYear: 2014 },
  '4541088F': { name: 'Battlefield 3', franchise: 'Battlefield', releaseYear: 2011 },
  '45410950': { name: 'Battlefield 4', franchise: 'Battlefield', releaseYear: 2013 },
  '454108A6': { name: 'Battlefield: Bad Company 2', franchise: 'Battlefield', releaseYear: 2010 },
  '5454082B': { name: 'Red Dead Redemption', franchise: 'Red Dead', releaseYear: 2010 },
  '545408A7': { name: 'Grand Theft Auto V', franchise: 'Grand Theft Auto', releaseYear: 2013 },
  '54540825': { name: 'Grand Theft Auto IV', franchise: 'Grand Theft Auto', releaseYear: 2008 },
  '425307D1': { name: 'The Elder Scrolls V: Skyrim', franchise: 'The Elder Scrolls', releaseYear: 2011 },
  '425307D5': { name: 'Fallout 3', franchise: 'Fallout', releaseYear: 2008 },
  '425307E6': { name: 'Fallout: New Vegas', franchise: 'Fallout', releaseYear: 2010 },
  '4D5307D5': { name: 'Mass Effect', franchise: 'Mass Effect', releaseYear: 2007 },
  '425607E1': { name: 'Mass Effect 2', franchise: 'Mass Effect', releaseYear: 2010 },
  '425607E3': { name: 'Mass Effect 3', franchise: 'Mass Effect', releaseYear: 2012 },
  '53450817': { name: 'Dead Space', franchise: 'Dead Space', releaseYear: 2008 },
  '5345083C': { name: 'Dead Space 2', franchise: 'Dead Space', releaseYear: 2011 },
  '5345085C': { name: 'Dead Space 3', franchise: 'Dead Space', releaseYear: 2013 },
  '55530812': { name: 'Saints Row: The Third', franchise: 'Saints Row', releaseYear: 2011 },
  '555308D4': { name: 'Saints Row IV', franchise: 'Saints Row', releaseYear: 2013 },
  '425607E5': { name: 'Dragon Age: Origins', franchise: 'Dragon Age', releaseYear: 2009 },
  '425607E8': { name: 'Dragon Age II', franchise: 'Dragon Age', releaseYear: 2011 },
  '42560801': { name: 'Dragon Age: Inquisition', franchise: 'Dragon Age', releaseYear: 2014 },
  '58410824': { name: 'Castle Crashers', franchise: 'Arcade', releaseYear: 2008 },
  '5841095A': { name: 'Trials HD', franchise: 'Arcade', releaseYear: 2009 },
  '58410A47': { name: 'LIMBO', franchise: 'Arcade', releaseYear: 2010 },
  '5841125A': { name: 'State of Decay', franchise: 'Arcade', releaseYear: 2013 },
  '58410954': { name: 'Banjo-Kazooie', franchise: 'Banjo-Kazooie', releaseYear: 2008 },
  '5841090B': { name: 'BattleBlock Theater', franchise: 'Arcade', releaseYear: 2013 },
  '58410B3A': { name: 'Bastion', franchise: 'Arcade', releaseYear: 2011 },
  '58410903': { name: 'Braid', franchise: 'Arcade', releaseYear: 2008 },
  '58410846': { name: 'Portal: Still Alive', franchise: 'Portal', releaseYear: 2008 },
  '4541080F': { name: "Mirror's Edge", franchise: "Mirror's Edge", releaseYear: 2008 },
  '4D530910': { name: 'Kinect Sports', franchise: 'Kinect Sports', releaseYear: 2010 },
  '4D530858': { name: 'Alan Wake', franchise: 'Alan Wake', releaseYear: 2010 },
  '584108A1': { name: 'Left 4 Dead', franchise: 'Left 4 Dead', releaseYear: 2008 },
  '58410912': { name: 'Left 4 Dead 2', franchise: 'Left 4 Dead', releaseYear: 2009 },
  '4D5307D1': { name: 'Crackdown', franchise: 'Crackdown', releaseYear: 2007 },
  '4D5308BC': { name: 'Crackdown 2', franchise: 'Crackdown', releaseYear: 2010 },
  '4D53081D': { name: 'Fable II', franchise: 'Fable', releaseYear: 2008 },
  '4D5308D6': { name: 'Fable III', franchise: 'Fable', releaseYear: 2010 },
  '545407F2': { name: 'Borderlands', franchise: 'Borderlands', releaseYear: 2009 },
  '5454087C': { name: 'Borderlands 2', franchise: 'Borderlands', releaseYear: 2012 },
  '545408E5': { name: 'BioShock', franchise: 'BioShock', releaseYear: 2007 },
  '54540850': { name: 'BioShock 2', franchise: 'BioShock', releaseYear: 2010 },
  '545408CF': { name: 'BioShock Infinite', franchise: 'BioShock', releaseYear: 2013 },
  '4B4E0805': { name: 'Ninja Gaiden II', franchise: 'Ninja Gaiden', releaseYear: 2008 },
  '4B4E082F': { name: 'Ninja Gaiden 3', franchise: 'Ninja Gaiden', releaseYear: 2012 },
  '434307D4': { name: 'Devil May Cry 4', franchise: 'Devil May Cry', releaseYear: 2008 },
  '43430824': { name: 'DmC: Devil May Cry', franchise: 'Devil May Cry', releaseYear: 2013 },
  '53450802': { name: 'Army of Two', franchise: 'Army of Two', releaseYear: 2008 },
  '5345084F': { name: 'Army of Two: The 40th Day', franchise: 'Army of Two', releaseYear: 2010 },
  '5345085D': { name: "Army of Two: The Devil's Cartel", franchise: 'Army of Two', releaseYear: 2013 },
  '555307D5': { name: 'Saints Row', franchise: 'Saints Row', releaseYear: 2006 },
  '5553081C': { name: 'Saints Row 2', franchise: 'Saints Row', releaseYear: 2008 },
  '54540818': { name: 'Mafia II', franchise: 'Mafia', releaseYear: 2010 },
  '545408B8': { name: 'Max Payne 3', franchise: 'Max Payne', releaseYear: 2012 },
  '5454082D': { name: 'L.A. Noire', franchise: 'Rockstar', releaseYear: 2011 },
  '4D5307E8': { name: 'Mass Effect', franchise: 'Mass Effect', releaseYear: 2007 },
  '41560813': { name: 'Call of Duty 3', franchise: 'Call of Duty', releaseYear: 2006 },
  '415607E1': { name: 'Call of Duty 2', franchise: 'Call of Duty', releaseYear: 2005 },
  '434307E6': { name: 'Resident Evil 5', franchise: 'Resident Evil', releaseYear: 2009 },
  '43430819': { name: 'Resident Evil 6', franchise: 'Resident Evil', releaseYear: 2012 },
  '434307D1': { name: 'Lost Planet: Extreme Condition', franchise: 'Lost Planet', releaseYear: 2006 },
  '434307ED': { name: 'Lost Planet 2', franchise: 'Lost Planet', releaseYear: 2010 },
  '4343082B': { name: 'Lost Planet 3', franchise: 'Lost Planet', releaseYear: 2013 },
  '434307D2': { name: 'Dead Rising', franchise: 'Dead Rising', releaseYear: 2006 },
  '434307EC': { name: 'Dead Rising 2', franchise: 'Dead Rising', releaseYear: 2010 },
  '4343081E': { name: 'Dead Rising 2: Off the Record', franchise: 'Dead Rising', releaseYear: 2011 },
  '5454081E': { name: 'Midnight Club: Los Angeles', franchise: 'Midnight Club', releaseYear: 2008 },
  '5454081F': { name: 'Bully: Scholarship Edition', franchise: 'Rockstar', releaseYear: 2008 },
  '545408A0': { name: 'Max Payne', franchise: 'Max Payne', releaseYear: 2011 },
  '4D5307D3': { name: 'Project Gotham Racing 3', franchise: 'Project Gotham Racing', releaseYear: 2005 },
  '4D5307FE': { name: 'Project Gotham Racing 4', franchise: 'Project Gotham Racing', releaseYear: 2007 },
  '4D5307E3': { name: 'Viva Pinata', franchise: 'Viva Pinata', releaseYear: 2006 },
  '4D530841': { name: 'Viva Pinata: Trouble in Paradise', franchise: 'Viva Pinata', releaseYear: 2008 },
  '4D5307D6': { name: 'Perfect Dark Zero', franchise: 'Perfect Dark', releaseYear: 2005 },
  '58410970': { name: 'Perfect Dark', franchise: 'Perfect Dark', releaseYear: 2010 },
  '4D5307D2': { name: 'Kameo: Elements of Power', franchise: 'Kameo', releaseYear: 2005 },
  '4D5307F1': { name: 'Blue Dragon', franchise: 'Mistwalker', releaseYear: 2006 },
  '4D53082B': { name: 'Lost Odyssey', franchise: 'Mistwalker', releaseYear: 2007 },
  '4D530839': { name: 'Too Human', franchise: 'Too Human', releaseYear: 2008 },
  '58410829': { name: 'UNO', franchise: 'UNO', releaseYear: 2006 },
  '58410821': { name: 'Geometry Wars: Retro Evolved', franchise: 'Geometry Wars', releaseYear: 2005 },
  '584108FF': { name: 'Geometry Wars: Retro Evolved 2', franchise: 'Geometry Wars', releaseYear: 2008 },
  '58410823': { name: 'Marble Blast Ultra', franchise: 'Arcade', releaseYear: 2006 },
  '5841084D': { name: 'Catan', franchise: 'Arcade', releaseYear: 2007 },
  '5841084E': { name: 'Carcassonne', franchise: 'Arcade', releaseYear: 2007 },
  '58410861': { name: 'Bomberman LIVE', franchise: 'Arcade', releaseYear: 2007 },
  '5841086C': { name: 'Sonic the Hedgehog', franchise: 'Sonic', releaseYear: 2006 },
  '5841086D': { name: 'Sonic the Hedgehog 2', franchise: 'Sonic', releaseYear: 2007 },
  '58410915': { name: 'Sonic the Hedgehog 3', franchise: 'Sonic', releaseYear: 2009 },
  '58410916': { name: 'Sonic & Knuckles', franchise: 'Sonic', releaseYear: 2009 },
  '58410A20': { name: 'Sonic Adventure', franchise: 'Sonic', releaseYear: 2010 },
  '58411202': { name: 'Sonic Adventure 2', franchise: 'Sonic', releaseYear: 2012 },
  '584108F1': { name: 'Castle of Shikigami III', franchise: 'Arcade', releaseYear: 2008 },
  '584109B6': { name: 'After Burner Climax', franchise: 'Arcade', releaseYear: 2010 },
  '58410B11': { name: 'Radiant Silvergun', franchise: 'Arcade', releaseYear: 2011 },
  '58410A5B': { name: 'Ikaruga', franchise: 'Arcade', releaseYear: 2008 },
  '58410A23': { name: 'Guwange', franchise: 'Arcade', releaseYear: 2010 },
  '584109C2': { name: 'Deathsmiles', franchise: 'Arcade', releaseYear: 2010 },
  'FFED0707': { name: 'Avatar Asset', franchise: 'System' },
  'FFFE07D1': { name: 'Xbox 360 Dashboard', franchise: 'System' },
};

function deriveFranchise(name: string) {
  const trimmedName = name.replace(/\s*\([^)]*\)\s*/g, '').trim();

  for (const separator of [' - ', ': ']) {
    const index = trimmedName.indexOf(separator);
    if (index > 0) {
      return trimmedName.slice(0, index).trim();
    }
  }

  return trimmedName;
}

function normalizeTitleName(name: string) {
  return name
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();
}

const titleCatalogMap = new Map<string, TitleInfo>();

for (const entry of XBOX_360_TITLE_DB_RAW) {
  const id = entry.id.toUpperCase();
  const override = TITLE_OVERRIDES[id];
  const name = normalizeTitleName(override?.name || entry.name);
  const franchise = override?.franchise || entry.franchise || deriveFranchise(name);
  const aliases = (entry.aliases || []).map(normalizeTitleName).filter((alias) => alias && alias !== name);

  titleCatalogMap.set(id, {
    id,
    name,
    franchise: franchise || 'Xbox 360',
    releaseYear: override?.releaseYear || entry.releaseYear,
    ...(aliases.length > 0 ? { aliases } : {}),
  });
}

for (const [id, override] of Object.entries(TITLE_OVERRIDES)) {
  if (titleCatalogMap.has(id)) {
    continue;
  }

  titleCatalogMap.set(id, { id, ...override });
}

const titleCatalog = [...titleCatalogMap.values()].sort((left, right) => {
  return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
});

export function getTitleCatalog() {
  return titleCatalog;
}

export function getTitleCatalogSize() {
  return titleCatalog.length;
}

export function getTitleInfo(titleId: string) {
  return titleCatalogMap.get(titleId.toUpperCase()) || null;
}

export function searchTitleCatalog(query: string) {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) {
    return [];
  }

  return titleCatalog.filter((entry) => {
    return (
      entry.id.toLowerCase().includes(trimmedQuery) ||
      entry.name.toLowerCase().includes(trimmedQuery) ||
      entry.franchise.toLowerCase().includes(trimmedQuery) ||
      (entry.aliases || []).some((alias) => alias.toLowerCase().includes(trimmedQuery))
    );
  });
}

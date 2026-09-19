export type AdSlotKey = 'sidebarBottom' | 'forumInfeed' | 'chatInfeed';

export interface AdSlotConfig {
  slotId: string;
  format: 'auto' | 'fluid';
  layoutKey?: string;
}

export const ADSENSE_PUBLISHER_ID = 'ca-pub-1360900082330864';

export const AD_SLOTS: Record<AdSlotKey, AdSlotConfig> = {
  sidebarBottom: {
    slotId: '0000000000',
    format: 'auto',
  },
  forumInfeed: {
    slotId: '0000000000',
    format: 'fluid',
    layoutKey: '-00-00-00-00',
  },
  chatInfeed: {
    slotId: '0000000000',
    format: 'fluid',
    layoutKey: '-00-00-00-00',
  },
};

export function adsenseEnabled(): boolean {
  return !ADSENSE_PUBLISHER_ID.includes('0000000000');
}
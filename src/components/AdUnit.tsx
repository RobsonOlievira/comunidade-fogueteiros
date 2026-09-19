import React, { useEffect, useRef } from 'react';
import { ADSENSE_PUBLISHER_ID, AD_SLOTS, adsenseEnabled, type AdSlotKey } from '@/src/config/adsense';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdUnitProps {
  slot: AdSlotKey;
  className?: string;
}

export default function AdUnit({ slot, className }: AdUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const conf = AD_SLOTS[slot];
  const ready = adsenseEnabled() && !!conf && !conf.slotId.includes('0000000000');

  useEffect(() => {
    if (!ready) return;
    const el = insRef.current;
    if (!el || el.dataset.adsensePushed === 'true') return;
    el.dataset.adsensePushed = 'true';
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (err) {
      console.warn('[AdSense] falha ao registrar slot', slot, err);
      delete el.dataset.adsensePushed;
    }
  }, [ready, slot]);

  if (!ready) return null;

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className ?? ''}`}
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_PUBLISHER_ID}
      data-ad-slot={conf.slotId}
      data-ad-format={conf.format}
      data-ad-layout-key={conf.layoutKey}
      data-full-width-responsive={conf.format === 'auto' ? 'true' : undefined}
    />
  );
}
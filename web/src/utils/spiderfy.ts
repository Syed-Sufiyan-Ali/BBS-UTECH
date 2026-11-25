import type { CampusPin, LatLng } from '../types/campus';
import { calculateDistanceMeters } from './geo';

export interface PinCluster {
  key: string;
  anchor: LatLng;
  pins: CampusPin[];
}

export interface SpiderOffset {
  x: number;
  y: number;
  angleRad: number;
}

/**
 * Groups visible pins that share the exact same building coordinates (or lie
 * within thresholdMeters of an existing cluster anchor) so overlapping markers
 * can be collapsed into a single interactive hub and fanned out cleanly on click.
 */
export function groupOverlappingPins(
  pins: CampusPin[],
  thresholdMeters = 6
): PinCluster[] {
  const clusters: PinCluster[] = [];

  for (const pin of pins) {
    let matched: PinCluster | undefined;
    for (const cluster of clusters) {
      const dist = calculateDistanceMeters(
        pin.latitude,
        pin.longitude,
        cluster.anchor.lat,
        cluster.anchor.lng
      );
      if (dist <= thresholdMeters) {
        matched = cluster;
        break;
      }
    }

    if (matched) {
      matched.pins.push(pin);
      const count = matched.pins.length;
      matched.anchor = {
        lat: matched.pins.reduce((sum, p) => sum + p.latitude, 0) / count,
        lng: matched.pins.reduce((sum, p) => sum + p.longitude, 0) / count,
      };
    } else {
      clusters.push({
        key: `${pin.latitude.toFixed(6)},${pin.longitude.toFixed(6)}`,
        anchor: { lat: pin.latitude, lng: pin.longitude },
        pins: [pin],
      });
    }
  }

  return clusters;
}

/**
 * Computes evenly spaced circular screen-pixel offsets around the shared hub.
 * For 2 overlapping pins, positions them cleanly Left & Right on the circle
 * so horizontal pill labels never overlap each other.
 */
export function computeCircleOffsets(count: number): SpiderOffset[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: 0, y: 0, angleRad: 0 }];

  const radiusPx = count === 2 ? 56 : Math.min(96, 46 + count * 8);
  const startAngle = count === 2 ? Math.PI : -Math.PI / 2;

  return Array.from({ length: count }, (_, idx) => {
    const angleRad = startAngle + (2 * Math.PI * idx) / count;
    return {
      x: Math.cos(angleRad) * radiusPx,
      y: Math.sin(angleRad) * radiusPx,
      angleRad,
    };
  });
}

export function findClusterKeyForPin(
  clusters: PinCluster[],
  pinId: string | null | undefined
): string | null {
  if (!pinId) return null;
  const cluster = clusters.find(
    (c) => c.pins.length >= 2 && c.pins.some((p) => p.id === pinId)
  );
  return cluster ? cluster.key : null;
}

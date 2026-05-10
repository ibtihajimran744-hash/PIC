import React from 'react';
import VPPortal from './VPPortal';

/**
 * DirectorPortal
 * Replicates the UI and functionality of VPPortal with a white theme and matching aesthetic.
 * All features and layout logic are shared via the refined Staff Portal engine.
 */
export function DirectorPortal(props: any) {
  return <VPPortal {...props} />;
}

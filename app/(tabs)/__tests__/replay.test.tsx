import React from 'react';
import { render } from '@testing-library/react-native';

import { MemoryNode } from '../replay';
import type { RiskLevel, ReplayEvent } from '@/types';

function makeEvent(riskLevel: RiskLevel): ReplayEvent {
  return {
    id: `evt_${riskLevel}`,
    title: `${riskLevel} title`,
    description: `${riskLevel} description`,
    riskChange: riskLevel === 'safe' ? -5 : 5,
    riskLevel,
    timestamp: new Date('2025-01-01T08:30:00Z'),
    appName: 'Example App',
    agentResponse: 'Agent handled the signal.',
  };
}

const RISK_LEVELS: RiskLevel[] = ['critical', 'high', 'medium', 'low', 'safe'];

describe('MemoryNode', () => {
  it.each(RISK_LEVELS)('renders the %s event card with badge, title and description', (riskLevel) => {
    const event = makeEvent(riskLevel);

    const { getByText } = render(
      <MemoryNode event={event} index={0} isLast themeId="nebula" timeFormat="24h"/>
    );

    // Risk badge text is the uppercased risk level.
    expect(getByText(riskLevel.toUpperCase())).toBeTruthy();
    // Title and description render.
    expect(getByText(event.title)).toBeTruthy();
    expect(getByText(event.description)).toBeTruthy();
  });
});

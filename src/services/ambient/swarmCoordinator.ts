// Maps realtime events to specific AI agent reactions.
// Agents respond differently by event type and severity - creating
// the feeling of a distributed intelligent system.

import type { OmnyxEvent, AgentId } from '@/events/types';
import type { AgentStatus } from '@/types';

export interface SwarmReaction {
  agentId: AgentId;
  status: AgentStatus;
  activity: string;
  holdMs: number;  // duration before agent returns to base state
}

export function getSwarmReactions(event: OmnyxEvent): SwarmReaction[] {
  const isCritical = event.severity === 'critical';
  const isHigh = event.severity === 'high';
  const title = event.title.slice(0, 52);

  switch (event.type) {
    case 'THREAT_DETECTED':
      return [
        {
          agentId: 'threat-agent',
          status: 'alert',
          activity: `Analyzing: ${title}`,
          holdMs: isCritical ? 9000 : isHigh ? 6000 : 4000,
        },
        {
          agentId: 'network-agent',
          status: 'scanning',
          activity: 'Cross-referencing network signatures',
          holdMs: 4500,
        },
        ...(isCritical || isHigh
          ? [
              {
                agentId: 'automation-agent' as AgentId,
                status: 'active' as AgentStatus,
                activity: 'Evaluating autonomous response protocols',
                holdMs: 7000,
              },
            ]
          : []),
      ];

    case 'SURVEILLANCE_ANOMALY':
      return [
        {
          agentId: 'behavior-agent',
          status: 'scanning',
          activity: `Profiling anomaly: ${title}`,
          holdMs: 5500,
        },
        {
          agentId: 'privacy-coach',
          status: 'active',
          activity: 'Generating surveillance briefing',
          holdMs: 4000,
        },
      ];

    case 'AI_ANALYSIS_COMPLETE':
      return [
        {
          agentId: 'privacy-coach',
          status: 'active',
          activity: event.description.slice(0, 64),
          holdMs: 3500,
        },
      ];

    case 'RISK_SCORE_CHANGE':
      return [
        {
          agentId: 'privacy-coach',
          status: 'active',
          activity: 'Recalculating risk profile with new data',
          holdMs: 3000,
        },
      ];

    case 'SCAN_COMPLETE':
      return [
        { agentId: 'threat-agent', status: 'active', activity: 'Reviewing permission scan results', holdMs: 4000 },
        { agentId: 'behavior-agent', status: 'active', activity: 'Updating behavioral baselines', holdMs: 3500 },
        { agentId: 'privacy-coach', status: 'active', activity: 'Synthesizing risk narrative', holdMs: 3000 },
        { agentId: 'network-agent', status: 'scanning', activity: 'Mapping permission-to-network exposure', holdMs: 2500 },
      ];

    default:
      return [];
  }
}

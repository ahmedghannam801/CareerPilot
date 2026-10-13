/**
 * CareerPilot AI - Server-Side Feature Flags
 * Allows graceful degradation and emergency circuit breaking
 * without restarting or redeploying the application.
 */

export interface FeatureFlagState {
  aiGateway: boolean;
  jobFeeds: boolean;
  voiceInterviews: boolean;
  atsTailoring: boolean;
  linkedinSync: boolean;
}

class FeatureFlagManager {
  private flags: FeatureFlagState = {
    aiGateway: process.env.FLAG_AI_GATEWAY !== 'false',
    jobFeeds: process.env.FLAG_JOB_FEEDS !== 'false',
    voiceInterviews: process.env.FLAG_VOICE_INTERVIEWS !== 'false',
    atsTailoring: process.env.FLAG_ATS_TAILORING !== 'false',
    linkedinSync: process.env.FLAG_LINKEDIN_SYNC !== 'false',
  };

  public isEnabled(flag: keyof FeatureFlagState): boolean {
    return this.flags[flag];
  }

  public setFlag(flag: keyof FeatureFlagState, enabled: boolean): void {
    this.flags[flag] = enabled;
  }

  public getAll(): FeatureFlagState {
    return { ...this.flags };
  }
}

export const featureFlags = new FeatureFlagManager();

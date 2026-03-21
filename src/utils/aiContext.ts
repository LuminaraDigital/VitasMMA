import { UserProfile } from '../types';

export function getAIContext(profile: UserProfile): string {
  let context = `\n\n--- FIGHTER PROFILE & HISTORICAL CONTEXT ---\n`;
  context += `Base Style: ${profile.baseStyle || 'Unknown'}\n`;
  context += `Stance: ${profile.stance || 'Unknown'}\n`;
  context += `Archetype: ${profile.archetype || 'Prospect'}\n`;
  context += `Level: ${profile.level || 1} (XP: ${profile.xp || 0})\n`;
  context += `Attributes: Striking (${profile.striking || 50}/100), Grappling (${profile.grappling || 50}/100), Clinch (${profile.clinch || 50}/100)\n`;

  if (profile.strengthLogs && profile.strengthLogs.length > 0) {
    const recentLogs = profile.strengthLogs.slice(-5);
    context += `\nRECENT STRENGTH & CONDITIONING LOGS:\n`;
    recentLogs.forEach(log => {
      context += `- ${log.date}: ${log.exercise} (${log.weight}lbs x ${log.reps} reps)\n`;
    });
  }

  if (profile.analysisHistory && profile.analysisHistory.length > 0) {
    const recentAnalyses = profile.analysisHistory.slice(-3);
    context += `\nPAST VIDEO ANALYSIS FEEDBACK (Use this to track progression, recurring habits, and improvements):\n`;
    recentAnalyses.forEach((analysis, i) => {
      // Truncate analysis if it's too long to save tokens
      const truncated = analysis.length > 500 ? analysis.substring(0, 500) + '...' : analysis;
      context += `--- Session ${i + 1} ---\n${truncated}\n`;
    });
  }

  if (profile.activeDrills && profile.activeDrills.length > 0) {
    const drills = profile.activeDrills.filter(d => !d.completed).map(d => d.title).join(', ');
    if (drills) {
      context += `\nCURRENTLY FOCUSING ON DRILLS: ${drills}\n`;
    }
  }

  context += `\nINSTRUCTION: Use the above historical data to provide highly personalized coaching. Reference their past habits, strength levels, and current focus areas to make your advice specific to their ongoing evolution as a fighter.\n-------------------------------------------\n`;

  return context;
}

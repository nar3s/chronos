import type { LLMProvider } from '@/src/store/settingsStore';
import type { Reflection } from '@/src/store/memoryStore';

export interface SessionNote {
  date: string;
  topic: string;
  subtopic: string;
  notes: string;
}

export interface InsightContext {
  studyMinutesToday: number;
  studyStreak: number;
  weeklyStudyMinutes: number;
  weeklyStudyGoalMinutes: number;
  gymCompletedToday: boolean;
  sleepHours: number | null;
  proteinGrams: number | null;
  dailyProteinGoal: number;
  recentSessionNotes: SessionNote[];
  recentReflections: Reflection[];
}

function buildPrompt(ctx: InsightContext): string {
  const weekPct = ctx.weeklyStudyGoalMinutes > 0
    ? Math.round((ctx.weeklyStudyMinutes / ctx.weeklyStudyGoalMinutes) * 100)
    : 0;

  const notesText =
    ctx.recentSessionNotes.length > 0
      ? ctx.recentSessionNotes
          .map((n) => `- ${n.date} | ${n.topic} - ${n.subtopic}: "${n.notes}"`)
          .join('\n')
      : 'No notes logged yet.';

  const reflectionText =
    ctx.recentReflections.length > 0
      ? ctx.recentReflections
          .map((r) => `- ${r.date}: "${r.text}"`)
          .join('\n')
      : 'None yet.';

  return `You are a focused daily coach for a student preparing for GATE MA (Mathematics). Generate a 2-sentence personalized insight based on today's data. Be direct, specific, and motivating - reference actual topics and takeaways when available. No generic advice.

TODAY'S DATA:
- Study: ${ctx.studyMinutesToday}min today, ${ctx.studyStreak}-day streak, ${ctx.weeklyStudyMinutes}min this week (${weekPct}% of ${ctx.weeklyStudyGoalMinutes}min weekly goal)
- Gym: ${ctx.gymCompletedToday ? 'Completed' : 'Not done'}
- Sleep: ${ctx.sleepHours !== null ? `${ctx.sleepHours}h` : 'Not logged'}
- Protein: ${ctx.proteinGrams !== null ? `${ctx.proteinGrams}g / ${ctx.dailyProteinGoal}g goal` : 'Not logged'}

RECENT STUDY NOTES & TAKEAWAYS:
${notesText}

PERSONAL REFLECTIONS:
${reflectionText}

Respond with ONLY 2 sentences. No preamble, no lists.`;
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 120 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function generateInsight(
  provider: LLMProvider,
  apiKey: string,
  ctx: InsightContext
): Promise<string> {
  if (!apiKey.trim()) throw new Error('No API key configured');
  const prompt = buildPrompt(ctx);
  if (provider === 'openai') return callOpenAI(apiKey, prompt);
  return callGemini(apiKey, prompt);
}

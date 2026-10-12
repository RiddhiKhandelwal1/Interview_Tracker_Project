import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';
import { callGemini, parseGeminiJSON } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { problems } = await request.json();
    if (!Array.isArray(problems) || problems.length === 0) return error('Problems array is required', 400);

    const stats = buildStats(problems);
    const prompt = buildPrompt(stats);
    const text = await callGemini(prompt);
    const plan = parseGeminiJSON(text);
    return success(plan, 200, 'Study plan generated');
  });
}

function buildStats(problems: Array<{ solved?: boolean; status?: string; difficulty?: string; topic?: string }>) {
  const solved = problems.filter((p) => p.solved || p.status === 'solved');
  const topicCounts: Record<string, number> = {};
  solved.forEach((p) => { if (p.topic) topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1; });
  return {
    total: problems.length, solved: solved.length,
    easy: solved.filter((p) => p.difficulty === 'easy').length,
    medium: solved.filter((p) => p.difficulty === 'medium').length,
    hard: solved.filter((p) => p.difficulty === 'hard').length,
    topicCounts,
  };
}

function buildPrompt(stats: ReturnType<typeof buildStats>) {
  return `You are an expert DSA interview coach. Analyze this student's progress and create a personalized 7-day study plan.

STUDENT DATA:
- Total problems tracked: ${stats.total}
- Total solved: ${stats.solved}
- Easy solved: ${stats.easy}
- Medium solved: ${stats.medium}
- Hard solved: ${stats.hard}
- Topics practiced: ${JSON.stringify(stats.topicCounts)}

Respond with a JSON object matching this exact schema:
{
  "summary": "2-3 sentence personalized analysis",
  "interviewReadiness": "Beginner" | "Intermediate" | "Advanced",
  "nextDifficultyTarget": "easy" | "medium" | "hard",
  "weeklyGoal": "e.g., 5 problems/day",
  "tip": "One specific actionable tip",
  "focusTopics": ["topic1", "topic2", "topic3"],
  "dailyPlan": [
    { "day": "Day 1", "task": "specific task description" },
    { "day": "Day 2", "task": "..." },
    { "day": "Day 3", "task": "..." },
    { "day": "Day 4", "task": "..." },
    { "day": "Day 5", "task": "..." },
    { "day": "Day 6", "task": "..." },
    { "day": "Day 7", "task": "..." }
  ]
}`;
}

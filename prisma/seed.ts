import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const demoEmail = 'demo@interviewprep.app';
  
  // Clean up existing demo user
  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (existingUser) {
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const hashedPassword = await bcrypt.hash('demo1234', 10);
  const problemsData = [
    { title: 'Two Sum', difficulty: 'easy', status: 'solved', platform: 'leetcode', topic: 'arrays' },
    { title: 'Valid Parentheses', difficulty: 'easy', status: 'solved', platform: 'leetcode', topic: 'stacks' },
    { title: 'Merge Two Sorted Lists', difficulty: 'easy', status: 'solved', platform: 'leetcode', topic: 'linked-lists' },
    { title: 'Maximum Subarray', difficulty: 'easy', status: 'solved', platform: 'leetcode', topic: 'arrays' },
    { title: 'Climbing Stairs', difficulty: 'easy', status: 'revising', platform: 'leetcode', topic: 'dp' },
    { title: '3Sum', difficulty: 'medium', status: 'attempted', platform: 'leetcode', topic: 'arrays' },
    { title: 'Group Anagrams', difficulty: 'medium', status: 'solved', platform: 'leetcode', topic: 'strings' },
    { title: 'Merge Intervals', difficulty: 'medium', status: 'pending', platform: 'leetcode', topic: 'arrays' },
    { title: 'Word Search', difficulty: 'medium', status: 'solved', platform: 'leetcode', topic: 'backtracking' },
    { title: 'Number of Islands', difficulty: 'medium', status: 'solved', platform: 'leetcode', topic: 'graphs' },
    { title: 'Clone Graph', difficulty: 'medium', status: 'revising', platform: 'leetcode', topic: 'graphs' },
    { title: 'Word Break', difficulty: 'medium', status: 'solved', platform: 'leetcode', topic: 'dp' },
    { title: 'Trapping Rain Water', difficulty: 'hard', status: 'solved', platform: 'leetcode', topic: 'arrays' },
    { title: 'N-Queens', difficulty: 'hard', status: 'pending', platform: 'leetcode', topic: 'backtracking' },
    { title: 'Median of Two Sorted Arrays', difficulty: 'hard', status: 'attempted', platform: 'leetcode', topic: 'arrays' },
    { title: 'Alien Dictionary', difficulty: 'hard', status: 'solved', platform: 'leetcode', topic: 'graphs' },
    { title: 'Find Median from Data Stream', difficulty: 'hard', status: 'revising', platform: 'leetcode', topic: 'heaps' },
  ];

  const user = await prisma.user.create({
    data: {
      name: 'Riddhi Khandelwal',
      email: demoEmail,
      password: hashedPassword,
      interviews: {
        create: [
          { company: 'Google', role: 'Software Engineer', status: 'technical', interviewStage: 'L3 Loop', applicationDate: new Date('2026-08-15'), interviewDate: new Date('2026-10-10') },
          { company: 'Meta', role: 'Frontend Engineer', status: 'oa', applicationDate: new Date('2026-09-01') },
          { company: 'Stripe', role: 'Software Engineer', status: 'applied', applicationDate: new Date('2026-09-20') },
        ]
      },
      notes: {
        create: [
          { title: 'Graph Traversal BFS vs DFS', content: 'BFS uses a Queue, shortest path. DFS uses a Stack/recursion.' },
          { title: 'React Hooks Under the Hood', content: 'Hooks rely on call order. Never put them in conditionals.' }
        ]
      }
    }
  });

  // Create problems and connect topics
  for (const p of problemsData) {
    const topic = await prisma.topic.upsert({
      where: { name: p.topic },
      update: {},
      create: { name: p.topic },
    });

    await prisma.problem.create({
      data: {
        title: p.title,
        difficulty: p.difficulty as any,
        status: p.status as any,
        platform: p.platform as any,
        userId: user.id,
        problemTopics: {
          create: [{ topicId: topic.id }]
        }
      }
    });
  }

  // Get problem IDs for Mistakes and Revisions
  const problems = await prisma.problem.findMany({ where: { userId: user.id } });
  
  if (problems.length > 0) {
    await prisma.mistake.createMany({
      data: [
        { userId: user.id, problemId: problems[0].id, type: 'edge_case', notes: 'Forgot to handle empty array.' },
        { userId: user.id, problemId: problems[5].id, type: 'time_complexity', notes: 'O(N^3) instead of O(N^2).' },
      ]
    });

    await prisma.problemRevision.createMany({
      data: [
        { userId: user.id, problemId: problems[4].id, nextReviewAt: new Date(Date.now() + 86400000) },
        { userId: user.id, problemId: problems[10].id, nextReviewAt: new Date(Date.now() + 172800000) },
        { userId: user.id, problemId: problems[16].id, nextReviewAt: new Date(Date.now() - 86400000) }, // Due yesterday
      ]
    });
  }

  console.log(`Seed successful. Demo user created: ${demoEmail} / demo1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

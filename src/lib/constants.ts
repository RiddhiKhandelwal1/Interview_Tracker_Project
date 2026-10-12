export const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'bg-emerald-500', textColor: 'text-emerald-500', bgLight: 'bg-emerald-500/10' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-500', bgLight: 'bg-amber-500/10' },
  { value: 'hard', label: 'Hard', color: 'bg-rose-500', textColor: 'text-rose-500', bgLight: 'bg-rose-500/10' },
] as const;

export const PLATFORMS = [
  { value: 'leetcode', label: 'LeetCode', color: '#FFA116' },
  { value: 'codeforces', label: 'Codeforces', color: '#3B82F6' },
  { value: 'gfg', label: 'GeeksforGeeks', color: '#10B981' },
  { value: 'interviewbit', label: 'InterviewBit', color: '#F97316' },
  { value: 'codechef', label: 'CodeChef', color: '#8B5CF6' },
  { value: 'other', label: 'Other', color: '#6B7280' },
] as const;

export const TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'Trees', 'Graphs',
  'Dynamic Programming', 'Greedy', 'Backtracking', 'Binary Search', 'Sorting',
  'Hashing', 'Heap', 'Trie', 'Sliding Window', 'Two Pointers',
  'Bit Manipulation', 'Math', 'Recursion', 'Matrix', 'Segment Tree', 'Disjoint Set',
] as const;

export const INTERVIEW_STATUSES = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { value: 'oa', label: 'Online Assessment', color: 'bg-purple-500' },
  { value: 'technical', label: 'Technical', color: 'bg-amber-500' },
  { value: 'hr', label: 'HR', color: 'bg-cyan-500' },
  { value: 'selected', label: 'Selected', color: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-zinc-500' },
] as const;

export const MISTAKE_TYPES = [
  { value: 'pattern_not_recognized', label: 'Pattern Not Recognized' },
  { value: 'concept_gap', label: 'Concept Gap' },
  { value: 'implementation_bug', label: 'Implementation Bug' },
  { value: 'edge_case', label: 'Edge Case' },
  { value: 'time_complexity', label: 'Time Complexity' },
  { value: 'space_complexity', label: 'Space Complexity' },
  { value: 'misread_question', label: 'Misread Question' },
  { value: 'could_not_derive_approach', label: 'Could Not Derive Approach' },
  { value: 'debugging_issue', label: 'Debugging Issue' },
  { value: 'other', label: 'Other' },
] as const;

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/problems', label: 'Problems', icon: 'Code2' },
  { path: '/notes', label: 'Notes', icon: 'StickyNote' },
  { path: '/interviews', label: 'Interviews', icon: 'Briefcase' },
  { path: '/resumes', label: 'Resumes', icon: 'FileText' },
  { path: '/analytics', label: 'Analytics', icon: 'BarChart3' },
  { path: '/job-prep', label: 'Job Prep', icon: 'Target' },
  { path: '/revision', label: 'Revision', icon: 'RefreshCw' },
  { path: '/mistakes', label: 'Mistakes', icon: 'AlertTriangle' },
] as const;

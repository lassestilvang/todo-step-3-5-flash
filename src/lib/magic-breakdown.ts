export function getMagicBreakdownSuggestions(title: string): string[] {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('meeting')) {
    return ['Prepare agenda', 'Take notes', 'Send follow-up email'];
  }
  if (lowerTitle.includes('project')) {
    return ['Define objectives', 'Draft roadmap', 'Review with stakeholders'];
  }
  if (lowerTitle.includes('learn') || lowerTitle.includes('study')) {
    return ['Find resources', 'Take notes', 'Practice exercise'];
  }
  if (lowerTitle.includes('clean') || lowerTitle.includes('house')) {
    return ['Gather supplies', 'Focus on one room', 'Organize belongings'];
  }
  if (lowerTitle.includes('buy') || lowerTitle.includes('shop')) {
    return ['Check inventory', 'Compare prices', 'Make a list'];
  }
  return ['Analyze requirements', 'Break into steps', 'Set initial milestone'];
}
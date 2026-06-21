import { describe, it, expect } from 'vitest';

import { getMagicBreakdownSuggestions } from '@/lib/magic-breakdown';

describe('magic-breakdown', () => {
  describe('getMagicBreakdownSuggestions', () => {
    it('should suggest meeting-related subtasks for meeting titles', () => {
      const suggestions = getMagicBreakdownSuggestions('Weekly team meeting');
      expect(suggestions).toContain('Prepare agenda');
      expect(suggestions).toContain('Take notes');
      expect(suggestions).toContain('Send follow-up email');
    });

    it('should suggest project-related subtasks for project titles', () => {
      const suggestions = getMagicBreakdownSuggestions('New project launch');
      expect(suggestions).toContain('Define objectives');
      expect(suggestions).toContain('Draft roadmap');
      expect(suggestions).toContain('Review with stakeholders');
    });

    it('should suggest study-related subtasks for learning titles', () => {
      const suggestions = getMagicBreakdownSuggestions('Learn React hooks');
      expect(suggestions).toContain('Find resources');
      expect(suggestions).toContain('Take notes');
      expect(suggestions).toContain('Practice exercise');
    });

    it('should suggest study-related subtasks for study titles', () => {
      const suggestions = getMagicBreakdownSuggestions('Study for exam');
      expect(suggestions).toContain('Find resources');
      expect(suggestions).toContain('Take notes');
      expect(suggestions).toContain('Practice exercise');
    });

    it('should suggest cleaning-related subtasks for clean/house titles', () => {
      const suggestions = getMagicBreakdownSuggestions('Clean the house');
      expect(suggestions).toContain('Gather supplies');
      expect(suggestions).toContain('Focus on one room');
      expect(suggestions).toContain('Organize belongings');
    });

    it('should suggest shopping-related subtasks for buy/shop titles', () => {
      const suggestions = getMagicBreakdownSuggestions('Buy groceries');
      expect(suggestions).toContain('Check inventory');
      expect(suggestions).toContain('Compare prices');
      expect(suggestions).toContain('Make a list');
    });

    it('should return default suggestions for unrecognized titles', () => {
      const suggestions = getMagicBreakdownSuggestions('Random task');
      expect(suggestions).toContain('Analyze requirements');
      expect(suggestions).toContain('Break into steps');
      expect(suggestions).toContain('Set initial milestone');
    });

    it('should be case-insensitive', () => {
      const lowerSuggestions = getMagicBreakdownSuggestions('MEETING');
      const upperSuggestions = getMagicBreakdownSuggestions('meeting');
      const mixedSuggestions = getMagicBreakdownSuggestions('MeEtInG');

      expect(lowerSuggestions).toEqual(upperSuggestions);
      expect(upperSuggestions).toEqual(mixedSuggestions);
    });

    it('should always return exactly 3 suggestions', () => {
      const tasks = ['meeting', 'project', 'learn', 'clean', 'buy', 'random task'];
      tasks.forEach((task) => {
        const suggestions = getMagicBreakdownSuggestions(task);
        expect(suggestions).toHaveLength(3);
      });
    });
  });
});
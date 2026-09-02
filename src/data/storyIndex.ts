import { ALL_469_BODHKATHAO_STORIES } from './allStoriesData';

export interface StoryIndexItem {
  id: number;
  title: string;
  bookPage: number;
  category?: string;
}

export const ALL_469_STORIES_INDEX: StoryIndexItem[] = ALL_469_BODHKATHAO_STORIES.map(s => ({
  id: s.id,
  title: s.title,
  bookPage: s.bookPage,
  category: s.category
}));


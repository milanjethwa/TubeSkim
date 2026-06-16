export interface ChapterItem {
  title: string;
  timestamp: string;
  summary: string;
  keyPoints: string[];
}

export interface ActionItem {
  task: string;
  category?: string;
  priority: string; // High, Medium, Low
}

export interface KeyConceptItem {
  concept: string;
  definition: string;
}

export interface QuizItem {
  question: string;
  answer: string;
}

export interface FlashcardItem {
  front: string;
  back: string;
}

export interface SkimmedNotesResult {
  title: string;
  channelName: string;
  duration: string;
  originalWordCount: number;
  savedReadingTimeMinutes: number;
  summaryIntro: string;
  chapters: ChapterItem[];
  actionItems: ActionItem[];
  keyConcepts: KeyConceptItem[];
  quizzes: QuizItem[];
  flashcards: FlashcardItem[];
  formattedMarkdown: string;
}

export interface SavedNoteItem {
  id: string;
  date: string;
  url: string;
  skimStyle: string;
  notes: SkimmedNotesResult;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

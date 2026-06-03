export const TOPIC_TAGS = [
  'IA Gratuita',
  'IA Paga',
  'Claude Code',
  'Gemini',
  'ChatGPT',
  'Opencode',
  'Vibe Coding',
  'WebDesign',
  'Skills',
  'Prompts',
] as const;

export type TopicTag = (typeof TOPIC_TAGS)[number];

export const isTopicTag = (value: string): value is TopicTag =>
  (TOPIC_TAGS as readonly string[]).includes(value);

import api from '@/lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: { source_type: string; source_title: string }[];
  answer_found?: boolean;
  isLoading?: boolean;
}

export interface AssistantStatus {
  enabled: boolean;
  index_status: 'not_indexed' | 'indexing' | 'ready' | 'failed';
  last_indexed_at: string | null;
}

export const assistantApi = {
  getStatus: (moduleId: number) =>
    api.get<AssistantStatus>(`/modules/${moduleId}/assistant/status`),

  getSuggestions: (moduleId: number) =>
    api.get<{ suggestions: string[] }>(`/modules/${moduleId}/assistant/suggestions`),

  chat: (moduleId: number, question: string) =>
    api.post<{ answer: string; sources: any[]; answer_found: boolean }>(
      `/modules/${moduleId}/assistant/chat`,
      { question }
    ),

  triggerIndex: (moduleId: number) =>
    api.post(`/modules/${moduleId}/assistant/index`),

  toggle: (moduleId: number, enabled: boolean) =>
    api.patch(`/modules/${moduleId}/assistant/toggle`, { enabled }),
};

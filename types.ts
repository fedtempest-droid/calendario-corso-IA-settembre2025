
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export interface AppState {
    isLoading: boolean;
    triggerWord: string;
    summaryTime: string; // HH:mm format
    isListening: boolean;
}


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent, Message, AppState } from './types';
import { analyzeAndManageCalendar } from './services/geminiService';
import useVoiceRecognition from './hooks/useVoiceRecognition';
import SettingsPanel from './components/SettingsPanel';
import ChatPanel from './components/ChatPanel';
import MonthlyCalendar from './components/MonthlyCalendar';
import { DUMMY_EVENTS } from './constants';
import { formatDate, isSameDay } from './utils/date';

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>(DUMMY_EVENTS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Ciao! Sono Lucy, la tua assistente calendario intelligente. Come posso aiutarti a organizzare la tua giornata?",
    },
  ]);
  const [appState, setAppState] = useState<AppState>({
    isLoading: false,
    triggerWord: 'lucy',
    summaryTime: '08:00',
    isListening: false,
  });

  const summaryIntervalRef = useRef<number | null>(null);
  const lastSummaryDateRef = useRef<string | null>(null);

  const addMessage = (sender: 'user' | 'assistant', text: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender, text }]);
  };

  const handleCommand = useCallback(async (command: string) => {
    if (!command) return;

    addMessage('user', command);
    setAppState((prev) => ({ ...prev, isLoading: true }));

    const programMatch = command.toLowerCase().match(/^(?:apri|avvia)\s(.+)/);
    if (programMatch && programMatch[1]) {
        const programName = programMatch[1].trim();
        addMessage('assistant', `Provo ad aprire ${programName}...`);
        // Note: This URI scheme launching is browser and OS dependent.
        window.location.href = `${programName}:`;
        setAppState((prev) => ({ ...prev, isLoading: false }));
        return;
    }

    try {
      const response = await analyzeAndManageCalendar(command, events);
      addMessage('assistant', response.responseText);
      
      if (response.updatedEvents) {
        setEvents(response.updatedEvents);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      const errorMessage = error instanceof Error ? error.message : "Ho riscontrato un problema. Riprova.";
      addMessage('assistant', `Errore: ${errorMessage}`);
    } finally {
      setAppState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [events]);
  
  const { isListening, transcript, startListening, stopListening } = useVoiceRecognition({
      triggerWord: appState.triggerWord,
      onCommand: handleCommand,
  });

  useEffect(() => {
    setAppState(prev => ({ ...prev, isListening }));
  }, [isListening]);

  const scheduleSummary = useCallback(() => {
    if (summaryIntervalRef.current) {
      clearInterval(summaryIntervalRef.current);
    }

    summaryIntervalRef.current = window.setInterval(async () => {
      const now = new Date();
      const [hour, minute] = appState.summaryTime.split(':').map(Number);

      const todayStr = formatDate(now);
      const lastSummaryDate = lastSummaryDateRef.current;

      if (now.getHours() === hour && now.getMinutes() === minute && todayStr !== lastSummaryDate) {
        lastSummaryDateRef.current = todayStr;
        console.log("Generating daily summary...");
        setAppState((prev) => ({ ...prev, isLoading: true }));

        const todayEvents = events.filter(event => isSameDay(new Date(event.startTime), now));
        const prompt = `Fornisci un breve e amichevole riepilogo dei seguenti eventi per oggi, ${todayStr}. Se non ci sono eventi, dillo con allegria.`;
        
        try {
          const { responseText } = await analyzeAndManageCalendar(prompt, todayEvents);
          addMessage('assistant', `Ecco il tuo riepilogo giornaliero per ${formatDate(new Date(), { day: 'numeric', month: 'long' })}:\n\n${responseText}`);
        } catch (error) {
          console.error("Failed to generate daily summary:", error);
          addMessage('assistant', "Ho avuto problemi a generare il tuo riepilogo giornaliero. Controlla la connessione.");
        } finally {
          setAppState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }, 60000); // Check every minute

  }, [appState.summaryTime, events]);

  useEffect(() => {
    scheduleSummary();
    return () => {
      if (summaryIntervalRef.current) {
        clearInterval(summaryIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.summaryTime, events]); // Rerun when time or events change

  return (
    <div className="flex h-screen w-full font-sans antialiased">
      <div className="w-1/3 max-w-sm flex-shrink-0 bg-slate-800 p-6 flex flex-col gap-8 overflow-y-auto">
        <MonthlyCalendar 
            events={events}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
        />
        <SettingsPanel 
            appState={appState} 
            setAppState={setAppState} 
            startListening={startListening}
            stopListening={stopListening}
        />
      </div>

      <div className="flex-grow flex flex-col bg-slate-900">
        <ChatPanel 
            messages={messages} 
            isLoading={appState.isLoading}
            isListening={appState.isListening}
            transcript={transcript}
            onSendMessage={handleCommand}
        />
      </div>
    </div>
  );
}

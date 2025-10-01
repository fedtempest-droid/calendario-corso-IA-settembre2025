
import { CalendarEvent } from './types';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const getISODate = (date: Date, hour: number, minute: number) => {
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
};


export const DUMMY_EVENTS: CalendarEvent[] = [
  {
    id: 'evt1',
    title: 'Morning Stand-up Meeting',
    startTime: getISODate(new Date(), 9, 0),
    endTime: getISODate(new Date(), 9, 15),
  },
  {
    id: 'evt2',
    title: 'Design Review',
    startTime: getISODate(new Date(), 11, 0),
    endTime: getISODate(new Date(), 12, 30),
  },
  {
    id: 'evt3',
    title: 'Lunch with Alex',
    startTime: getISODate(new Date(), 13, 0),
    endTime: getISODate(new Date(), 14, 0),
  },
  {
    id: 'evt4',
    title: 'Project Phoenix Sync',
    startTime: getISODate(new Date(), 15, 30),
    endTime: getISODate(new Date(), 16, 30),
  },
   {
    id: 'evt5',
    title: 'Dentist Appointment',
    startTime: getISODate(tomorrow, 10, 0),
    endTime: getISODate(tomorrow, 10, 45),
  },
];

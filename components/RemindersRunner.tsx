'use client';

import { useEffect } from 'react';
import { tickReminders } from '@/lib/reminders';

const TICK_MS = 5 * 60 * 1000;

export default function RemindersRunner() {
  useEffect(() => {
    tickReminders();
    const id = window.setInterval(tickReminders, TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  return null;
}

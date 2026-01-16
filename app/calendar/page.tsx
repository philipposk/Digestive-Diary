'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';

export default function CalendarPage() {
  const foodLogs = useAppStore((state) => state.foodLogs);
  const symptoms = useAppStore((state) => state.symptoms);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');

  // Group logs by date
  const logsByDate = useMemo(() => {
    const grouped = new Map<string, typeof foodLogs>();
    foodLogs.forEach((log) => {
      const logTimestamp = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
      const dateKey = formatDate(logTimestamp);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(log);
    });
    return grouped;
  }, [foodLogs]);

  // Get unique dates with logs
  const datesWithLogs = useMemo(() => {
    return Array.from(logsByDate.keys()).map(dateStr => {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      return date;
    }).sort((a, b) => b.getTime() - a.getTime());
  }, [logsByDate]);

  // Get logs for selected date
  const selectedDateLogs = useMemo(() => {
    const dateKey = formatDate(selectedDate);
    return logsByDate.get(dateKey) || [];
  }, [logsByDate, selectedDate]);

  // Get symptoms for selected date
  const selectedDateSymptoms = useMemo(() => {
    const dateKey = formatDate(selectedDate);
    return symptoms.filter(s => {
      const sTimestamp = s.timestamp instanceof Date ? s.timestamp : new Date(s.timestamp);
      return formatDate(sTimestamp) === dateKey;
    });
  }, [symptoms, selectedDate]);

  // Calendar month view
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; hasLogs: boolean; isCurrentMonth: boolean }> = [];
    
    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        hasLogs: logsByDate.has(formatDate(date)),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        hasLogs: logsByDate.has(formatDate(date)),
        isCurrentMonth: true,
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        hasLogs: logsByDate.has(formatDate(date)),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentYear, currentMonth, daysInMonth, startingDayOfWeek, logsByDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(new Date(currentYear, currentMonth + (direction === 'next' ? 1 : -1), 1));
  };

  const navigateToToday = () => {
    setSelectedDate(new Date());
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Food Calendar</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'month' ? 'day' : 'month')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
          >
            {viewMode === 'month' ? 'Day View' : 'Month View'}
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
          >
            + Log Food
          </Link>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              →
            </button>
          </div>
          <button
            onClick={navigateToToday}
            className="mb-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Today
          </button>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((dayInfo, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDate(dayInfo.date);
                  setViewMode('day');
                }}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  dayInfo.date.toDateString() === new Date().toDateString()
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : dayInfo.hasLogs
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                } ${!dayInfo.isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className="text-sm font-medium">
                  {dayInfo.date.getDate()}
                </div>
                {dayInfo.hasLogs && (
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1" />
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Date Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {formatDate(selectedDate)}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const prevDay = new Date(selectedDate);
                    prevDay.setDate(prevDay.getDate() - 1);
                    setSelectedDate(prevDay);
                  }}
                  className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  ←
                </button>
                <button
                  onClick={navigateToToday}
                  className="px-3 py-1 text-sm text-primary-600 dark:text-primary-400"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const nextDay = new Date(selectedDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setSelectedDate(nextDay);
                  }}
                  className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Food Logs for Selected Date */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">
              Foods Logged ({selectedDateLogs.length})
            </h3>
            {selectedDateLogs.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No foods logged for this date.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedDateLogs
                  .sort((a, b) => {
                    const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
                    const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
                    return aTime.getTime() - bTime.getTime();
                  })
                  .map((log) => (
                    <div
                      key={log.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-lg">{log.food}</div>
                          {log.quantity && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {log.quantity}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatTime(log.timestamp)}
                          </div>
                        </div>
                      </div>
                      {log.tags && log.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {log.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {log.macros && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            {log.macros.calories && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Calories: </span>
                                <span className="font-medium">{log.macros.calories}</span>
                              </div>
                            )}
                            {log.macros.protein && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Protein: </span>
                                <span className="font-medium">{log.macros.protein}g</span>
                              </div>
                            )}
                            {log.macros.carbs && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Carbs: </span>
                                <span className="font-medium">{log.macros.carbs}g</span>
                              </div>
                            )}
                            {log.macros.fat && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Fat: </span>
                                <span className="font-medium">{log.macros.fat}g</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {log.notes && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {log.notes}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Symptoms for Selected Date */}
          {selectedDateSymptoms.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">
                Symptoms ({selectedDateSymptoms.length})
              </h3>
              <div className="space-y-2">
                {selectedDateSymptoms
                  .sort((a, b) => {
                    const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
                    const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
                    return aTime.getTime() - bTime.getTime();
                  })
                  .map((symptom) => (
                    <div
                      key={symptom.id}
                      className="text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded"
                    >
                      {symptom.type} (severity: {symptom.severity}/10) at {formatTime(symptom.timestamp)}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Link 
          href="/"
          className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          ← Back to Log
        </Link>
      </div>
    </div>
  );
}

export function getMonthAbbrev(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

export function getMonthTitle(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

export function getDayNumber(date: Date): string {
  return date.getDate().toString();
}

export function formatTime12(date: Date): string {
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();
}

export function formatDayAndTime(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${weekday}, ${formatTime12(date)}`;
}

export function formatAttendeeCount(count: number): string {
  if (count <= 1) return '1';
  return `${count}`;
}

export function formatTime12Upper(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatMeetingTimeRange(start: Date, end: Date): string {
  const month = start.toLocaleDateString('en-US', { month: 'short' });
  const day = start.getDate();
  const startTime = formatTime12Upper(start);
  const endTime = formatTime12Upper(end);
  return `${day} ${month} · ${startTime} – ${endTime}`;
}

export function formatPillDateTimeRange(start: Date, end: Date): string {
  const day = start.getDate();
  const month = start.toLocaleDateString('en-US', { month: 'short' });
  const startStr = formatTime12(start);
  const endStr = formatTime12(end);
  return `${day} ${month} · ${startStr} – ${endStr}`;
}

export function formatTimeRange(start: Date, end: Date): string {
  const weekday = start.toLocaleDateString('en-US', { weekday: 'short' });
  const day = start.getDate();
  const month = start.toLocaleDateString('en-US', { month: 'short' });
  const startTime = start
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: start.getMinutes() === 0 ? undefined : '2-digit',
      hour12: true,
    })
    .toLowerCase();
  const endTime = end
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: end.getMinutes() === 0 ? undefined : '2-digit',
      hour12: true,
    })
    .toLowerCase();
  return `${weekday} ${day} ${month} ${startTime} - ${endTime}`;
}

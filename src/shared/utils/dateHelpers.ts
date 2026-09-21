// ==========================================
// Date & Time Utility Functions
// ==========================================

export const formatDate = (dateString?: string | Date | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const formatDateTime = (dateString?: string | Date | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

export const formatTime = (timeString?: string | Date | null): string => {
  if (!timeString) return 'N/A';
  const date = typeof timeString === 'string' && timeString.includes('T')
    ? new Date(timeString)
    : new Date(`2000-01-01T${timeString}`);

  if (isNaN(date.getTime())) return typeof timeString === 'string' ? timeString : 'N/A';

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

export const getISODateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

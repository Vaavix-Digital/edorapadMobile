// ==========================================
// Filtering and Search Utilities
// ==========================================

export const filterBySearchQuery = <T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: (keyof T)[]
): T[] => {
  if (!query || !query.trim()) return items;
  const lowerQuery = query.toLowerCase().trim();

  return items.filter(item => {
    return fields.some(field => {
      const val = item[field];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(lowerQuery);
    });
  });
};

export const filterAttendanceByStatus = <T extends { status: string }>(
  records: T[],
  statusFilter: string
): T[] => {
  if (!statusFilter || statusFilter.toLowerCase() === 'all') return records;
  return records.filter(
    record => record.status?.toLowerCase() === statusFilter.toLowerCase()
  );
};

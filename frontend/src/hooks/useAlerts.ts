import { useMemo, useState } from 'react';
import type { AlertData } from '../store';

type SeverityFilter = 'all' | 'critical' | 'medium' | 'low';
type TypeFilter = 'all' | string;

export function useAlerts(alerts: AlertData[]) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    let result = alerts;

    if (severityFilter !== 'all') {
      result = result.filter(a => a.severity === severityFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter(a => a.emergency_type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.details?.toLowerCase().includes(q) ||
        a.room_number?.toLowerCase().includes(q) ||
        a.emergency_type.toLowerCase().includes(q) ||
        `#${a.id}`.includes(q)
      );
    }

    return result;
  }, [alerts, severityFilter, typeFilter, searchQuery]);

  const criticalCount = useMemo(() => alerts.filter(a => a.severity === 'critical').length, [alerts]);
  const warningCount = useMemo(() => alerts.filter(a => a.severity === 'medium').length, [alerts]);
  const safeCount = useMemo(() => alerts.filter(a => a.severity === 'low').length, [alerts]);

  return {
    filteredAlerts,
    severityFilter,
    setSeverityFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    criticalCount,
    warningCount,
    safeCount,
  };
}

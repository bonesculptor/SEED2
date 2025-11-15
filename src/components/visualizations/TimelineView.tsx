import React, { useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface TimelineRecord {
  id: string;
  type: string;
  date: string;
  title: string;
  category: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface TimelineViewProps {
  records: TimelineRecord[];
  onRecordClick?: (record: TimelineRecord) => void;
}

interface GroupedRecords {
  [year: string]: {
    [month: string]: TimelineRecord[];
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  diagnosis: 'bg-red-500',
  medication: 'bg-blue-500',
  labResult: 'bg-green-500',
  procedure: 'bg-amber-500',
  imaging: 'bg-purple-500',
  observation: 'bg-cyan-500',
  default: 'bg-slate-500',
};

const CATEGORY_ICONS: Record<string, string> = {
  diagnosis: '🏥',
  medication: '💊',
  labResult: '🔬',
  procedure: '⚕️',
  imaging: '📷',
  observation: '📋',
  default: '📄',
};

export function TimelineView({ records, onRecordClick }: TimelineViewProps) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const groupedRecords = useMemo<GroupedRecords>(() => {
    const grouped: GroupedRecords = {};

    records.forEach(record => {
      const date = new Date(record.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('default', { month: 'long' });

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = [];
      }

      grouped[year][month].push(record);
    });

    Object.keys(grouped).forEach(year => {
      Object.keys(grouped[year]).forEach(month => {
        grouped[year][month].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });
    });

    return grouped;
  }, [records]);

  const years = useMemo(() => {
    return Object.keys(groupedRecords).sort((a, b) => parseInt(b) - parseInt(a));
  }, [groupedRecords]);

  const toggleYear = (year: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const toggleMonth = (yearMonth: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(yearMonth)) {
      newExpanded.delete(yearMonth);
    } else {
      newExpanded.add(yearMonth);
    }
    setExpandedMonths(newExpanded);
  };

  const getCategoryColor = (category: string): string => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  };

  const getCategoryIcon = (category: string): string => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
  };

  return (
    <div className="space-y-4">
      {years.map(year => {
        const isYearExpanded = expandedYears.has(year);
        const months = Object.keys(groupedRecords[year]);
        const totalRecords = months.reduce(
          (sum, month) => sum + groupedRecords[year][month].length,
          0
        );

        return (
          <div key={year} className="border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleYear(year)}
              className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isYearExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-lg font-semibold text-white">{year}</span>
              </div>
              <span className="text-sm text-slate-400">
                {totalRecords} record{totalRecords !== 1 ? 's' : ''}
              </span>
            </button>

            {isYearExpanded && (
              <div className="bg-slate-900">
                {months.map(month => {
                  const yearMonth = `${year}-${month}`;
                  const isMonthExpanded = expandedMonths.has(yearMonth);
                  const monthRecords = groupedRecords[year][month];

                  return (
                    <div key={yearMonth} className="border-t border-slate-700">
                      <button
                        onClick={() => toggleMonth(yearMonth)}
                        className="w-full flex items-center justify-between p-3 pl-12 bg-slate-850 hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isMonthExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-medium text-white">{month}</span>
                        </div>
                        <span className="text-sm text-slate-400">
                          {monthRecords.length} record{monthRecords.length !== 1 ? 's' : ''}
                        </span>
                      </button>

                      {isMonthExpanded && (
                        <div className="space-y-2 p-4 pl-16">
                          {monthRecords.map(record => (
                            <div
                              key={record.id}
                              onClick={() => onRecordClick?.(record)}
                              className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-750 cursor-pointer transition-colors"
                            >
                              <div className="relative">
                                <div
                                  className={`w-10 h-10 ${getCategoryColor(
                                    record.category
                                  )} rounded-full flex items-center justify-center text-xl flex-shrink-0`}
                                >
                                  {getCategoryIcon(record.category)}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-medium text-white truncate">
                                    {record.title}
                                  </h4>
                                  <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {new Date(record.date).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-400 mt-1">
                                  {record.type}
                                </p>
                                {record.description && (
                                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                                    {record.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`text-xs ${getCategoryColor(record.category)} bg-opacity-20 px-2 py-1 rounded`}>
                                    {record.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {years.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No medical records found</p>
        </div>
      )}
    </div>
  );
}

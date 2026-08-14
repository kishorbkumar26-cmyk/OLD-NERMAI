import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (val: any, row: any) => React.ReactNode;
}

interface AdminTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  isLoading?: boolean;
}

export const AdminTable: React.FC<AdminTableProps> = ({ columns, data, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return <div className="text-white p-8 text-center animate-pulse">Loading data...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-textSecondary p-8 text-center bg-surface/50 rounded-xl border border-accent/20">No data found</div>;
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-accent/20 bg-surface/80 backdrop-blur-sm">
      <table className="w-full text-left text-sm text-[#E5E5E5]">
        <thead className="bg-accent/20 text-xs uppercase text-textPrimary">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4 font-semibold">{col.label}</th>
            ))}
            {(onEdit || onDelete) && <th className="px-6 py-4 text-right font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#8B0000]/10">
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-white/5 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-3">
                    {onEdit && (
                      <button onClick={() => onEdit(row)} className="text-[#D4AF37] hover:text-[#FFDF73] transition-colors p-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(row)} className="text-accent hover:text-error transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

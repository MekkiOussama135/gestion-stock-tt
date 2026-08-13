import { Download, FileText, Plus } from 'lucide-react';
import { LastUpdated } from '../LastUpdated';

export function PageHeader({
  title,
  subtitle,
  onExportExcel,
  onExportPdf,
  primaryAction, // { label, icon, onClick }
  showFormToggle,
  onToggleForm,
  formOpen,
  lastUpdatedItems, // liste d'entités (avec updatedAt/createdAt) pour le badge "Dernière mise à jour"
  children,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight gradient-text-blue">{title}</h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{subtitle}</p>
        )}
        {lastUpdatedItems && (
          <div className="mt-1">
            <LastUpdated items={lastUpdatedItems} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm btn-secondary"
          >
            <Download size={14} className="text-gray-500 dark:text-gray-400" />
            Exporter Excel
          </button>
        )}
        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm btn-secondary"
          >
            <FileText size={14} className="text-gray-500 dark:text-gray-400" />
            Export PDF
          </button>
        )}

        {showFormToggle && (
          <button
            onClick={onToggleForm}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm btn-primary"
          >
            <Plus size={16} className={`transition-transform duration-200 ${formOpen ? 'rotate-45' : ''}`} />
            {formOpen ? 'Fermer' : primaryAction?.label || 'Ajouter'}
          </button>
        )}

        {!showFormToggle && primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm btn-primary"
          >
            {primaryAction.icon ? <primaryAction.icon size={16} /> : <Plus size={16} />}
            {primaryAction.label}
          </button>
        )}

        {children}
      </div>
    </div>
  );
}

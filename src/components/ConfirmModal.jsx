export default function ConfirmModal({ title, message, confirmLabel = 'Eliminar', onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 dark:bg-black/60 px-4">
      <div className="card w-full max-w-sm p-5">
        <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">{title}</h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">{message}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 dark:bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition disabled:opacity-50"
          >
            {loading ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

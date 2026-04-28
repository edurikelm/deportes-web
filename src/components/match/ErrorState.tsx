'use client'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-6xl">⚠️</div>
      <h3 className="mb-2 text-lg font-semibold text-white">{message}</h3>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-[#ef4444] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#dc2626]"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

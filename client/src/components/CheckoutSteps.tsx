export type CheckoutStep = 'cart' | 'checkout' | 'confirmation'

interface CheckoutStepsProps {
  current: CheckoutStep
}

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: 'cart', label: 'Cart' },
  { key: 'checkout', label: 'Shipping & Payment' },
  { key: 'confirmation', label: 'Confirmation' },
]

const STEP_INDEX: Record<CheckoutStep, number> = {
  cart: 0,
  checkout: 1,
  confirmation: 2,
}

export default function CheckoutSteps({ current }: CheckoutStepsProps) {
  const currentIndex = STEP_INDEX[current]

  return (
    <nav className="mb-8 flex items-center justify-center gap-2 sm:gap-4" aria-label="Checkout progress">
      {STEPS.map((step, index) => {
        const isComplete = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isComplete
                    ? 'bg-green-600 text-white'
                    : isCurrent
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isComplete ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isCurrent
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`mb-5 h-0.5 w-8 rounded sm:w-16 ${
                  index < currentIndex ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

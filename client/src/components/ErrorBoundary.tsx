import { Component, type ErrorInfo, type ReactNode } from 'react'
import Button from './Button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-4 max-w-md text-gray-600">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <Button
            onClick={() => window.location.assign('/')}
            className="mt-6"
          >
            Back to Home
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

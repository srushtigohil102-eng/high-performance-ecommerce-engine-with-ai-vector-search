import { NavLink } from 'react-router-dom'
import Button from '../components/Button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-lg text-gray-600">Page not found</p>
        <NavLink to="/" className="mt-6 inline-block">
          <Button>Back to Home</Button>
        </NavLink>
      </div>
    </div>
  )
}

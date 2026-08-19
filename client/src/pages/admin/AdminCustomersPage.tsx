import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminUsers } from '../../services/adminService'
import type { AdminUsersResponse } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import Button from '../../components/Button'
import Pagination from '../../components/Pagination'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDateTime'

export default function AdminCustomersPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<AdminUsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getAdminUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
      })
      setData(result)
    } catch {
      setError('Failed to load customers.')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function handleRoleChange(value: string) {
    setRoleFilter(value)
    setPage(1)
  }

  if (loading) return <LoadingSpinner size="md" message="Loading customers..." />
  if (error) return <ErrorMessage message={error}><Button onClick={fetchUsers}>Retry</Button></ErrorMessage>
  if (!data) return null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {data.total} registered users &middot; order totals exclude cancelled orders
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 min-h-[44px] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
          />
          <Button type="submit" className="min-h-[44px] shrink-0">Search</Button>
        </form>
        <select
          value={roleFilter}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 min-h-[44px] sm:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
        >
          <option value="">All Roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {data.users.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No customers found.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-right">Total Spent</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {data.users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/admin/customers/${user.id}`)}
                    className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.emailVerified ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{user.orderCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(user.totalSpent)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                      {formatDateTime(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {data.users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => navigate(`/admin/customers/${user.id}`)}
                className="rounded-lg border border-gray-200 p-4 text-left transition hover:border-gray-300 hover:shadow-sm min-h-[44px] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(user.totalSpent)}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {user.orderCount} orders &middot; {user.role} &middot; {formatDateTime(user.createdAt)}
                </p>
              </button>
            ))}
          </div>

          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

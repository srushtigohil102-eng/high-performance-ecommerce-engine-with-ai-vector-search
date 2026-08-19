import { useState, useEffect, useCallback } from 'react'
import { getAdminAuditLogs } from '../../services/adminService'
import type { AuditLogEntry, AdminAuditLogsResponse } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import Button from '../../components/Button'
import Pagination from '../../components/Pagination'
import { formatDateTime } from '../../utils/formatDateTime'

const KNOWN_ACTIONS = [
  'user.registered',
  'product.created',
  'product.updated',
  'product.deleted',
  'order.status_changed',
  'order.tracking_updated',
]

const ACTION_LABELS: Record<string, string> = {
  'user.registered': 'User Registered',
  'product.created': 'Product Created',
  'product.updated': 'Product Updated',
  'product.deleted': 'Product Deleted',
  'order.status_changed': 'Order Status Changed',
  'order.tracking_updated': 'Tracking Updated',
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

function summarizeDetails(details: Record<string, unknown> | undefined): string {
  if (!details || Object.keys(details).length === 0) return ''
  try {
    return JSON.stringify(details)
  } catch {
    return String(details)
  }
}

export default function AdminAuditLogPage() {
  const [data, setData] = useState<AdminAuditLogsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getAdminAuditLogs({
        page,
        limit: 20,
        action: actionFilter || undefined,
      })
      setData(result)
    } catch {
      setError('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  function handleActionChange(value: string) {
    setActionFilter(value)
    setPage(1)
  }

  if (loading) return <LoadingSpinner size="md" message="Loading audit log..." />
  if (error) return <ErrorMessage message={error}><Button onClick={fetchLogs}>Retry</Button></ErrorMessage>
  if (!data) return null

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Append-only trail of admin actions ({data.total} entries)
          </p>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => handleActionChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 min-h-[44px] sm:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
        >
          <option value="">All Actions</option>
          {KNOWN_ACTIONS.map((action) => (
            <option key={action} value={action}>
              {actionLabel(action)}
            </option>
          ))}
        </select>
      </div>

      {data.logs.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No audit entries found.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {data.logs.map((log: AuditLogEntry) => (
                  <tr key={log.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {log.actor ? (
                        <>
                          <p className="font-medium text-gray-900 dark:text-white">{log.actor.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{log.actor.email}</p>
                        </>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{log.resource}</p>
                      {log.resourceId && (
                        <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{log.resourceId}</p>
                      )}
                    </td>
                    <td className="max-w-[280px] px-4 py-3">
                      <code className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {summarizeDetails(log.details)}
                      </code>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {log.ip ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {data.logs.map((log: AuditLogEntry) => (
              <div key={log.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {actionLabel(log.action)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(log.createdAt)}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {log.actor ? log.actor.name : 'System'}
                  <span className="ml-2 text-gray-500 dark:text-gray-400">{log.resource}</span>
                </p>
                {log.resourceId && (
                  <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{log.resourceId}</p>
                )}
                {summarizeDetails(log.details) && (
                  <code className="mt-2 block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {summarizeDetails(log.details)}
                  </code>
                )}
              </div>
            ))}
          </div>

          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

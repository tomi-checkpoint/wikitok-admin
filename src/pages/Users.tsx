import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  is_banned: boolean
  created_at: string
}

interface UsersProps {
  onToast: (type: 'success' | 'error' | 'info', text: string) => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const PAGE_SIZE = 20

export default function Users({ onToast }: UsersProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'pause' | 'unpause' | 'delete'
    user: User
  } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_banned, created_at', { count: 'exact' })

      if (search.trim()) {
        query = query.or(`username.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`)
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      setUsers(data ?? [])
      setTotalCount(count ?? 0)
    } catch (err) {
      console.error(err)
      onToast('error', 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search, page, onToast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Reset to page 0 when search changes
  useEffect(() => {
    setPage(0)
  }, [search])

  async function handlePause(user: User) {
    setActionLoading(user.id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: true })
        .eq('id', user.id)

      if (error) throw error
      onToast('success', `User @${user.username} has been paused`)
      await fetchUsers()
    } catch (err) {
      console.error(err)
      onToast('error', 'Failed to pause user')
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
    }
  }

  async function handleUnpause(user: User) {
    setActionLoading(user.id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: false })
        .eq('id', user.id)

      if (error) throw error
      onToast('success', `User @${user.username} has been unpaused`)
      await fetchUsers()
    } catch (err) {
      console.error(err)
      onToast('error', 'Failed to unpause user')
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
    }
  }

  async function handleDelete(user: User) {
    setActionLoading(user.id)
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) throw error
      onToast('success', `User @${user.username} has been permanently deleted`)
      await fetchUsers()
    } catch (err) {
      console.error(err)
      onToast('error', 'Failed to delete user')
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
      setDeleteConfirmText('')
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or display name..."
            className="w-full px-4 py-3 pl-10 bg-[#1e293b] border border-[#334155] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <span className="text-slate-400 text-sm">
          {totalCount} user{totalCount !== 1 ? 's' : ''} total
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left text-xs text-slate-400 font-medium px-6 py-3 uppercase tracking-wider">User</th>
                <th className="text-left text-xs text-slate-400 font-medium px-6 py-3 uppercase tracking-wider">Display Name</th>
                <th className="text-left text-xs text-slate-400 font-medium px-6 py-3 uppercase tracking-wider">Joined</th>
                <th className="text-left text-xs text-slate-400 font-medium px-6 py-3 uppercase tracking-wider">Status</th>
                <th className="text-right text-xs text-slate-400 font-medium px-6 py-3 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    {search ? 'No users match your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#334155]/50 hover:bg-[#334155]/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-accent text-sm font-bold">
                            {(user.username || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white text-sm font-medium">
                          @{user.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      {user.display_name || '---'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Paused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.is_banned ? (
                          <button
                            onClick={() => setConfirmDialog({ type: 'unpause', user })}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                          >
                            Unpause
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDialog({ type: 'pause', user })}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                          >
                            Pause
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDialog({ type: 'delete', user })}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#334155]">
            <span className="text-slate-400 text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded-lg bg-[#334155] text-slate-300 hover:bg-[#475569] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-[#334155] text-slate-300 hover:bg-[#475569] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            {confirmDialog.type === 'delete' ? (
              <>
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white text-center mb-2">
                  Delete User Permanently
                </h3>
                <p className="text-slate-400 text-sm text-center mb-4">
                  This will permanently delete <span className="text-white font-medium">@{confirmDialog.user.username}</span> and all their data. This action cannot be undone.
                </p>
                <p className="text-slate-400 text-sm text-center mb-4">
                  Type <span className="text-red-400 font-mono">{confirmDialog.user.username}</span> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors text-sm mb-4"
                  placeholder="Type username to confirm"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setConfirmDialog(null)
                      setDeleteConfirmText('')
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-[#334155] text-slate-300 hover:bg-[#475569] transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(confirmDialog.user)}
                    disabled={deleteConfirmText !== confirmDialog.user.username || actionLoading === confirmDialog.user.id}
                    className="flex-1 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {actionLoading === confirmDialog.user.id ? 'Deleting...' : 'Delete Forever'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {confirmDialog.type === 'pause' ? 'Pause User' : 'Unpause User'}
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  {confirmDialog.type === 'pause'
                    ? `Are you sure you want to pause @${confirmDialog.user.username}? They will not be able to use the app while paused.`
                    : `Are you sure you want to unpause @${confirmDialog.user.username}? They will regain full access to the app.`
                  }
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2.5 rounded-lg bg-[#334155] text-slate-300 hover:bg-[#475569] transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      confirmDialog.type === 'pause'
                        ? handlePause(confirmDialog.user)
                        : handleUnpause(confirmDialog.user)
                    }
                    disabled={actionLoading === confirmDialog.user.id}
                    className={`flex-1 py-2.5 rounded-lg text-white transition-colors text-sm font-medium disabled:opacity-50 ${
                      confirmDialog.type === 'pause'
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {actionLoading === confirmDialog.user.id
                      ? 'Processing...'
                      : confirmDialog.type === 'pause'
                      ? 'Pause User'
                      : 'Unpause User'
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalSaves: number
  totalComments: number
}

interface RecentUser {
  id: string
  username: string
  display_name: string | null
  created_at: string
}

interface GrowthDay {
  date: string
  count: number
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [growth, setGrowth] = useState<GrowthDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Fetch all stats in parallel
      const [
        usersRes,
        activeUsersRes,
        savesRes,
        commentsRes,
        recentRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', sevenDaysAgo.toISOString()),
        supabase.from('saved_articles').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, username, display_name, created_at').order('created_at', { ascending: false }).limit(20),
      ])

      setStats({
        totalUsers: usersRes.count ?? 0,
        activeUsers: activeUsersRes.count ?? 0,
        totalSaves: savesRes.count ?? 0,
        totalComments: commentsRes.count ?? 0,
      })

      setRecentUsers(recentRes.data ?? [])

      // Calculate growth for last 14 days
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

      const growthRes = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', fourteenDaysAgo.toISOString())
        .order('created_at', { ascending: true })

      const growthData = growthRes.data ?? []
      const dayMap = new Map<string, number>()

      // Initialize all 14 days
      for (let i = 13; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        dayMap.set(key, 0)
      }

      // Count signups per day
      for (const row of growthData) {
        const key = row.created_at.split('T')[0]
        if (dayMap.has(key)) {
          dayMap.set(key, (dayMap.get(key) ?? 0) + 1)
        }
      }

      const growthArr: GrowthDay[] = []
      dayMap.forEach((count, date) => {
        growthArr.push({ date, count })
      })
      setGrowth(growthArr)

    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  const maxGrowth = Math.max(...growth.map((g) => g.count), 1)

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, color: 'text-accent' },
    { label: 'Active Users (7d)', value: stats?.activeUsers ?? 0, color: 'text-green-400' },
    { label: 'Total Saves', value: stats?.totalSaves ?? 0, color: 'text-purple-400' },
    { label: 'Total Comments', value: stats?.totalComments ?? 0, color: 'text-amber-400' },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#1e293b] border border-[#334155] rounded-xl p-6"
          >
            <p className="text-slate-400 text-sm mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color}`}>
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* User Growth Chart */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-6">User Signups (Last 14 Days)</h3>
        <div className="flex items-end gap-2 h-40">
          {growth.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400">{day.count}</span>
              <div
                className="w-full bg-accent/80 rounded-t-sm min-h-[2px] transition-all"
                style={{ height: `${(day.count / maxGrowth) * 120}px` }}
              />
              <span className="text-[10px] text-slate-500 mt-1">
                {formatShortDate(day.date)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Signups */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#334155]">
          <h3 className="text-white font-semibold">Recent Signups</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left text-xs text-slate-400 font-medium px-6 py-3 uppercase tracking-wider">
                  Username
                </th>
                <th className="text-left text-xs text-slate-400 font-medium px-6 py-3 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="text-left text-xs text-slate-400 font-medium px-6 py-3 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#334155]/50 hover:bg-[#334155]/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
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
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

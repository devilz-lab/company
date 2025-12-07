'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { MessageCircle, Users, Heart, Sparkles, Brain, TrendingUp } from 'lucide-react'

interface Stats {
  totalConversations: number
  totalMessages: number
  userMessages: number
  assistantMessages: number
  messagesByDay: Array<{ date: string; count: number }>
  personaUsage: Array<{ name: string; count: number }>
  memoryByType: Array<{ type: string; count: number }>
  kinkByStatus: Array<{ status: string; count: number }>
  totalExplorations: number
  modeStats: Array<{ mode: string; count: number }>
  totalPersonas: number
  totalMemories: number
  totalKinks: number
  totalMilestones: number
}

const COLORS = ['#3a3a3a', '#4a4a4a', '#5a5a5a', '#6a6a6a', '#7a7a7a']

export function StatsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/stats')
      if (!response.ok) throw new Error('Failed to load stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-[#888]">No stats available yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-[#888]" />
            <span className="text-sm text-[#888]">Conversations</span>
          </div>
          <p className="text-2xl font-bold text-[#ededed]">{stats.totalConversations}</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-[#888]" />
            <span className="text-sm text-[#888]">Messages</span>
          </div>
          <p className="text-2xl font-bold text-[#ededed]">{stats.totalMessages}</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[#888]" />
            <span className="text-sm text-[#888]">Personas</span>
          </div>
          <p className="text-2xl font-bold text-[#ededed]">{stats.totalPersonas}</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-[#888]" />
            <span className="text-sm text-[#888]">Memories</span>
          </div>
          <p className="text-2xl font-bold text-[#ededed]">{stats.totalMemories}</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#888]" />
            <span className="text-sm text-[#888]">Kinks</span>
          </div>
          <p className="text-2xl font-bold text-[#ededed]">{stats.totalKinks}</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-[#888]" />
            <span className="text-sm text-[#888]">Milestones</span>
          </div>
          <p className="text-2xl font-bold text-[#ededed]">{stats.totalMilestones}</p>
        </div>
      </div>

      {/* Messages over time */}
      {stats.messagesByDay.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-4">Messages Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.messagesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="date" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#ededed' }}
              />
              <Line type="monotone" dataKey="count" stroke="#3a3a3a" strokeWidth={2} dot={{ fill: '#3a3a3a' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Persona usage */}
      {stats.personaUsage.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-4">Persona Usage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats.personaUsage}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#3a3a3a"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {stats.personaUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Kink status */}
      {stats.kinkByStatus.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-4">Kink Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.kinkByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="status" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
                tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
              />
              <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#3a3a3a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Memory types */}
      {stats.memoryByType.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-4">Memory Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.memoryByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="type" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
                tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
              />
              <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#3a3a3a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}


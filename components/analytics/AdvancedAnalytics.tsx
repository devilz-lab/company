'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Clock, MessageSquare, Heart } from 'lucide-react'

interface Analytics {
  messagesByHour: Array<{ hour: number; count: number }>
  messagesByDayOfWeek: Array<{ day: string; count: number }>
  messagesByMonth: Array<{ month: string; count: number }>
  averageResponseTime: number
  conversationLength: number
  reactionRate: number
  personaEngagement: Array<{ name: string; conversations: number }>
  kinkExplorationRate: number
  kinkCategories: Array<{ category: string; count: number }>
  memoryGrowth: Array<{ date: string; count: number }>
  memoryStrengthDistribution: Array<{ range: string; count: number }>
  modeUsage: Array<{ mode: string; count: number }>
}

const COLORS = ['#3a3a3a', '#4a4a4a', '#5a5a5a', '#6a6a6a', '#7a7a7a']

export function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/analytics')
      if (!response.ok) throw new Error('Failed to load analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
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

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#888]" />
            <span className="text-xs text-[#888]">Avg Response Time</span>
          </div>
          <p className="text-xl font-bold text-[#ededed]">
            {Math.round(analytics.averageResponseTime)} min
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-[#888]" />
            <span className="text-xs text-[#888]">Reaction Rate</span>
          </div>
          <p className="text-xl font-bold text-[#ededed]">
            {analytics.reactionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Messages by Hour */}
      {analytics.messagesByHour.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-4">Activity by Hour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.messagesByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="hour" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
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

      {/* Messages by Day of Week */}
      {analytics.messagesByDayOfWeek.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-4">Activity by Day</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.messagesByDayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="day" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
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

      {/* Memory Strength Distribution */}
      {analytics.memoryStrengthDistribution.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-4">Memory Strength Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={analytics.memoryStrengthDistribution}
                dataKey="count"
                nameKey="range"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#3a3a3a"
              >
                {analytics.memoryStrengthDistribution.map((entry, index) => (
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

      {/* Kink Categories */}
      {analytics.kinkCategories.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-4">Kink Categories</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.kinkCategories}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="category" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
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


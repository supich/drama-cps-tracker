'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { BarChart3, Download, TrendingUp, Eye, MousePointerClick, DollarSign, Share2, MessageCircle, ThumbsUp } from 'lucide-react'

interface PageStats {
  id: string
  pageName: string
  pageId: string
  status: string
  fansCount: number
  healthScore: number
  stats: {
    views: number
    reactions: number
    comments: number
    shares: number
    clicks: number
    conversions: number
    revenue: number
  }
  totalLogs: number
}

interface DramaStats {
  dramaId: string
  dramaName: string
  stats: {
    views: number
    reactions: number
    comments: number
    shares: number
    clicks: number
    conversions: number
    revenue: number
  }
  videoCount: number
}

interface TimeStats {
  date: string
  views: number
  reactions: number
  comments: number
  shares: number
  clicks: number
  conversions: number
  revenue: number
}

export default function AnalyticsPage() {
  const [statsByPage, setStatsByPage] = useState<PageStats[]>([])
  const [statsByDrama, setStatsByDrama] = useState<DramaStats[]>([])
  const [statsByTime, setStatsByTime] = useState<TimeStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pages' | 'dramas' | 'time'>('pages')
  const [dateRange, setDateRange] = useState<string>('30')
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString()

      const [pageRes, dramaRes, timeRes] = await Promise.all([
        fetch(`/api/analytics/pages?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/analytics/dramas?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/analytics/time?startDate=${startDate}&endDate=${endDate}&groupBy=day`),
      ])

      const [pageResult, dramaResult, timeResult] = await Promise.all([
        pageRes.json(),
        dramaRes.json(),
        timeRes.json(),
      ])

      if (pageResult.success) setStatsByPage(pageResult.data)
      if (dramaResult.success) setStatsByDrama(dramaResult.data)
      if (timeResult.success) setStatsByTime(timeResult.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: string) => {
    try {
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString()
      
      const response = await fetch(`/api/analytics/export?type=${type}&startDate=${startDate}&endDate=${endDate}`)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics_${type}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({ title: 'Success', description: 'Export started' })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      })
    }
  }

  const totalStats = statsByPage.reduce(
    (acc, page) => ({
      views: acc.views + (page.stats?.views || 0),
      reactions: acc.reactions + (page.stats?.reactions || 0),
      comments: acc.comments + (page.stats?.comments || 0),
      shares: acc.shares + (page.stats?.shares || 0),
      clicks: acc.clicks + (page.stats?.clicks || 0),
      conversions: acc.conversions + (page.stats?.conversions || 0),
      revenue: acc.revenue + (page.stats?.revenue || 0),
    }),
    { views: 0, reactions: 0, comments: 0, shares: 0, clicks: 0, conversions: 0, revenue: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your publishing performance and revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport(activeTab)}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.views)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.clicks)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.conversions)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reactions</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.reactions)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.comments)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.shares)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pages'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('pages')}
        >
          By Page
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'dramas'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('dramas')}
        >
          By Drama
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'time'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('time')}
        >
          Over Time
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      ) : (
        <>
          {/* By Page */}
          {activeTab === 'pages' && (
            <Card>
              <CardHeader>
                <CardTitle>Performance by Page</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statsByPage.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No data available</p>
                  ) : (
                    statsByPage.map((page) => (
                      <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{page.pageName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(page.fansCount)} fans • {page.totalLogs} posts
                          </p>
                        </div>
                        <div className="grid grid-cols-4 gap-8 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Views</p>
                            <p className="font-medium">{formatNumber(page.stats?.views || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Clicks</p>
                            <p className="font-medium">{formatNumber(page.stats?.clicks || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Conversions</p>
                            <p className="font-medium">{formatNumber(page.stats?.conversions || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="font-medium">{formatCurrency(page.stats?.revenue || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* By Drama */}
          {activeTab === 'dramas' && (
            <Card>
              <CardHeader>
                <CardTitle>Performance by Drama</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statsByDrama.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No data available</p>
                  ) : (
                    statsByDrama.map((drama) => (
                      <div key={drama.dramaId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{drama.dramaName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {drama.videoCount} videos
                          </p>
                        </div>
                        <div className="grid grid-cols-4 gap-8 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Views</p>
                            <p className="font-medium">{formatNumber(drama.stats?.views || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Clicks</p>
                            <p className="font-medium">{formatNumber(drama.stats?.clicks || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Conversions</p>
                            <p className="font-medium">{formatNumber(drama.stats?.conversions || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="font-medium">{formatCurrency(drama.stats?.revenue || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Over Time */}
          {activeTab === 'time' && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {statsByTime.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No data available</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-medium">Date</th>
                          <th className="text-right py-2 px-4 font-medium">Views</th>
                          <th className="text-right py-2 px-4 font-medium">Clicks</th>
                          <th className="text-right py-2 px-4 font-medium">Conversions</th>
                          <th className="text-right py-2 px-4 font-medium">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsByTime.map((day) => (
                          <tr key={day.date} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-4">{day.date}</td>
                            <td className="text-right py-2 px-4">{formatNumber(day.views)}</td>
                            <td className="text-right py-2 px-4">{formatNumber(day.clicks)}</td>
                            <td className="text-right py-2 px-4">{formatNumber(day.conversions)}</td>
                            <td className="text-right py-2 px-4">{formatCurrency(day.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
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
import { BarChart3, Download, TrendingUp, Eye, MousePointerClick, DollarSign, Share2, MessageCircle, ThumbsUp, RefreshCw } from 'lucide-react'

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
  const [syncing, setSyncing] = useState(false)
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
        title: '错误',
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
      
      toast({ title: '导出成功', description: '文件已开始下载' })
    } catch (error) {
      toast({
        title: '错误',
        description: 'Failed to export data',
        variant: 'destructive',
      })
    }
  }

  const handleSyncInsights = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 1000 }),
      })
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || '同步 Facebook 数据失败')
      }

      await fetchAnalytics()
      const firstFailure = result.data.failures?.[0]?.message
      toast({
        title: result.data.failed > 0 ? '部分同步完成' : '同步完成',
        description: firstFailure
          ? `已同步 ${result.data.synced} 个任务，失败 ${result.data.failed} 个：${firstFailure}`
          : `已同步 ${result.data.synced} 个任务，失败 ${result.data.failed} 个`,
        variant: result.data.failed > 0 ? 'destructive' : 'default',
      })
    } catch (error: any) {
      toast({
        title: '同步失败',
        description: error.message || '无法同步 Facebook 数据',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
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
          <h1 className="text-3xl font-bold">数据分析</h1>
          <p className="text-muted-foreground">
            追踪发布表现与收益数据
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncInsights} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : '同步 Facebook 数据'}
          </Button>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">过去 7 天</SelectItem>
              <SelectItem value="14">过去 14 天</SelectItem>
              <SelectItem value="30">过去 30 天</SelectItem>
              <SelectItem value="90">过去 90 天</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport(activeTab)}>
            <Download className="mr-2 h-4 w-4" />
            导出 CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">播放总量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.views)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">点击总数</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.clicks)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">转化数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.conversions)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">收益</CardTitle>
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
            <CardTitle className="text-sm font-medium">点赞</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.reactions)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">评论</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.comments)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">分享</CardTitle>
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
          按主页
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'dramas'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('dramas')}
        >
          按剧集
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'time'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('time')}
        >
          按时间
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">正在加载分析数据...</div>
        </div>
      ) : (
        <>
          {/* By Page */}
          {activeTab === 'pages' && (
            <Card>
              <CardHeader>
                <CardTitle>按主页表现</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statsByPage.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">暂无数据</p>
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
                            <p className="text-sm text-muted-foreground">播放量</p>
                            <p className="font-medium">{formatNumber(page.stats?.views || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">点击</p>
                            <p className="font-medium">{formatNumber(page.stats?.clicks || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">转化</p>
                            <p className="font-medium">{formatNumber(page.stats?.conversions || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">收益</p>
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
                <CardTitle>按剧集表现</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statsByDrama.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">暂无数据</p>
                  ) : (
                    statsByDrama.map((drama) => (
                      <div key={drama.dramaId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{drama.dramaName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {drama.videoCount} 个视频
                          </p>
                        </div>
                        <div className="grid grid-cols-4 gap-8 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground">播放量</p>
                            <p className="font-medium">{formatNumber(drama.stats?.views || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">点击</p>
                            <p className="font-medium">{formatNumber(drama.stats?.clicks || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">转化</p>
                            <p className="font-medium">{formatNumber(drama.stats?.conversions || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">收益</p>
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
                <CardTitle>按时间表现</CardTitle>
              </CardHeader>
              <CardContent>
                {statsByTime.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">暂无数据</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-medium">日期</th>
                          <th className="text-right py-2 px-4 font-medium">播放量</th>
                          <th className="text-right py-2 px-4 font-medium">点击</th>
                          <th className="text-right py-2 px-4 font-medium">转化</th>
                          <th className="text-right py-2 px-4 font-medium">收益</th>
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

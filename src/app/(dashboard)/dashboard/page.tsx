'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNumber, formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import {
  Facebook,
  Video,
  Play,
  MousePointerClick,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from 'lucide-react'

interface DashboardData {
  totalPages: number
  activePages: number
  totalVideos: number
  totalVariants: number
  totalTasks: number
  publishedTasks: number
  performance: {
    views: number
    reactions: number
    comments: number
    shares: number
    clicks: number
    conversions: number
    revenue: number
  } | null
  today: {
    publishedTasks: number
    performance: {
      views: number
      clicks: number
      conversions: number
      revenue: number
    } | null
  }
  recentTasks: Array<{
    id: string
    status: string
    scheduledAt: string
    publishedAt: string | null
    page: { pageName: string }
    video: { title: string }
    variant: { variantName: string }
  }>
  topVideos: Array<{
    id: string
    title: string
    drama: { dramaName: string }
    stats: {
      views: number
      clicks: number
      conversions: number
      revenue: number
    } | null
  }>
  riskPages: Array<{
    id: string
    pageName: string
    status: string
    healthScore: number
    pageId: string
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/overview')
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error?.message || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      setError('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }
  
  if (!data) {
    return null
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your publishing overview.
          </p>
        </div>
        <Button asChild>
          <Link href="/scheduler">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Posts
          </Link>
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <Facebook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPages}</div>
            <p className="text-xs text-muted-foreground">
              {data.activePages} active pages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Posts</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.today.publishedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {data.publishedTasks} total published
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Views</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data.today.performance?.views || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(data.performance?.views || 0)} total views
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.today.performance?.revenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(data.performance?.revenue || 0)} total revenue
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Today's Performance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data.today.performance?.clicks || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data.today.performance?.conversions || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalVideos}</div>
            <p className="text-xs text-muted-foreground">
              {data.totalVariants} variants created
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Publish Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent tasks</p>
              ) : (
                data.recentTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {task.variant.variantName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.page.pageName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(task.publishedAt || task.scheduledAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {data.recentTasks.length > 5 && (
              <div className="mt-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/tasks">View all tasks</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Top Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topVideos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No video data yet</p>
              ) : (
                data.topVideos.map((video) => (
                  <div key={video.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {video.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {video.drama.dramaName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatNumber(video.stats?.views || 0)} views
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(video.stats?.revenue || 0)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Risk Pages */}
      {data.riskPages.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Risk Pages Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.riskPages.map((page) => (
                <div key={page.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{page.pageName}</p>
                    <p className="text-sm text-muted-foreground">ID: {page.pageId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(page.status)}>
                      {page.status}
                    </Badge>
                    <span className={`text-sm font-medium ${
                      page.healthScore < 60 ? 'text-red-600' : 
                      page.healthScore < 80 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      Health: {page.healthScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/pages">Manage Pages</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime, formatNumber } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { MousePointerClick, Search, Download, ExternalLink } from 'lucide-react'

interface ClickLog {
  id: string
  dramaId: string | null
  pageId: string | null
  videoId: string | null
  variantId: string | null
  ip: string | null
  userAgent: string | null
  referer: string | null
  targetUrl: string
  createdAt: string
  page: {
    pageName: string
  } | null
  video: {
    title: string
  } | null
  variant: {
    variantName: string
  } | null
}

export default function ClicksPage() {
  const [clicks, setClicks] = useState<ClickLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<string>('7')
  const [totalClicks, setTotalClicks] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchClicks()
  }, [dateRange])

  const fetchClicks = async () => {
    try {
      setLoading(true)
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString()
      
      const response = await fetch(`/api/clicks?startDate=${startDate}&endDate=${endDate}&limit=1000`)
      const result = await response.json()

      if (result.success) {
        setClicks(result.data.clicks)
        setTotalClicks(result.data.pagination.total)
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '获取点击日志失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredClicks = clicks.filter(click => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (click.page?.pageName || '').toLowerCase().includes(searchLower) ||
      (click.video?.title || '').toLowerCase().includes(searchLower) ||
      (click.variant?.variantName || '').toLowerCase().includes(searchLower) ||
      (click.ip || '').includes(searchQuery) ||
      click.targetUrl.includes(searchQuery)
    )
  })

  const handleExport = () => {
    const csvContent = [
      ['ID', '主页', '视频', '剪辑版本', 'IP', '浏览器', '来源', '目标链接', '点击时间'],
      ...filteredClicks.map(click => [
        click.id,
        click.page?.pageName || '',
        click.video?.title || '',
        click.variant?.variantName || '',
        click.ip || '',
        click.userAgent || '',
        click.referer || '',
        click.targetUrl,
        formatDateTime(click.createdAt),
      ])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `click_logs_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({ title: '导出成功', description: '文件已开始下载' })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">点击日志</h1>
          <p className="text-muted-foreground">
            追踪 CPS 链接点击数据（共 {formatNumber(totalClicks)} 条）
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出 CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索点击记录..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">过去 24 小时</SelectItem>
            <SelectItem value="7">过去 7 天</SelectItem>
            <SelectItem value="14">过去 14 天</SelectItem>
            <SelectItem value="30">过去 30 天</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">点击总数</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalClicks)}</div>
            <p className="text-xs text-muted-foreground">
              过去 {dateRange} 天
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clicks Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">正在加载点击日志...</div>
        </div>
      ) : filteredClicks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MousePointerClick className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">未找到点击记录</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? '请尝试其他搜索内容' : '所选时间范围内暂无点击数据'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>主页</TableHead>
                    <TableHead>视频</TableHead>
                    <TableHead>剪辑版本</TableHead>
                    <TableHead className="w-[120px]">IP</TableHead>
                    <TableHead className="w-[180px]">时间</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClicks.map((click) => (
                    <TableRow key={click.id}>
                      <TableCell className="font-mono text-sm">
                        {click.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {click.page?.pageName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="line-clamp-1">
                          {click.video?.title || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {click.variant?.variantName || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {click.ip || '未知'}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[120px]">
                          {click.userAgent?.split(' ')[0] || ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDateTime(click.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(click.targetUrl)
                            toast({ title: '已复制', description: 'URL 已复制到剪贴板' })
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
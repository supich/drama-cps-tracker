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
import { getStatusColor } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { ListTodo, RefreshCw, XCircle, RotateCcw, ChevronLeft, ChevronRight, Trash2, Send } from 'lucide-react'

interface PublishTask {
  id: string
  status: string
  scheduledAt: string
  publishedAt: string | null
  retryCount: number
  errorMessage: string | null
  page: { id: string; pageName: string; pageId: string } | null
  video: { id: string; title: string } | null
  variant: { id: string; variantName: string; title: string } | null
}

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'PENDING', label: '待发布' },
  { value: 'PROCESSING', label: '发布中' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'FAILED', label: '失败' },
  { value: 'CANCELED', label: '已取消' },
]

const STATUS_LABELS: Record<string, string> = {
  PENDING: '待发布',
  PROCESSING: '发布中',
  PUBLISHED: '已发布',
  FAILED: '失败',
  CANCELED: '已取消',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<PublishTask[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const limit = 20

  useEffect(() => {
    fetchTasks()
  }, [statusFilter, page])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const response = await fetch(`/api/publish-tasks?${params}`)
      const result = await response.json()
      if (result.success) {
        setTasks(result.data.tasks)
        setTotal(result.data.pagination.total)
        setTotalPages(result.data.pagination.pages)
      }
    } catch {
      toast({ title: '错误', description: '获取任务列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (taskId: string) => {
    try {
      setActionLoading(taskId)
      const response = await fetch(`/api/publish-tasks/${taskId}/cancel`, { method: 'PATCH' })
      const result = await response.json()
      if (result.success) {
        toast({ title: '成功', description: '任务已取消' })
        fetchTasks()
      } else {
        toast({ title: '错误', description: result.error?.message || '取消失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '操作失败', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handlePublishNow = async (taskId: string) => {
    try {
      setActionLoading(taskId)
      const response = await fetch(`/api/publish-tasks/${taskId}/publish-now`, { method: 'PATCH' })
      const result = await response.json()
      if (result.success) {
        toast({ title: '成功', description: '任务已加入立即发布队列' })
        fetchTasks()
      } else {
        toast({ title: '错误', description: result.error?.message || '立即发布失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '操作失败', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('确定要删除这个发布任务吗？此操作不可撤销。')) return

    try {
      setActionLoading(taskId)
      const response = await fetch(`/api/publish-tasks/${taskId}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        toast({ title: '成功', description: '任务已删除' })
        fetchTasks()
      } else {
        toast({ title: '错误', description: result.error?.message || '删除失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '操作失败', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRetry = async (taskId: string) => {
    try {
      setActionLoading(taskId)
      const response = await fetch(`/api/publish-tasks/${taskId}/retry`, { method: 'PATCH' })
      const result = await response.json()
      if (result.success) {
        toast({ title: '成功', description: '任务已重新加入队列' })
        fetchTasks()
      } else {
        toast({ title: '错误', description: result.error?.message || '重试失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '操作失败', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">发布任务</h1>
          <p className="text-muted-foreground mt-1">查看与管理所有发布任务</p>
        </div>
        <Button variant="outline" onClick={fetchTasks} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            任务列表
            <span className="text-sm font-normal text-muted-foreground ml-1">（共 {total} 条）</span>
          </CardTitle>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">暂无任务记录</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-3 px-2 font-medium">状态</th>
                      <th className="text-left py-3 px-2 font-medium">主页</th>
                      <th className="text-left py-3 px-2 font-medium">视频</th>
                      <th className="text-left py-3 px-2 font-medium">版本</th>
                      <th className="text-left py-3 px-2 font-medium">计划时间</th>
                      <th className="text-left py-3 px-2 font-medium">发布时间</th>
                      <th className="text-left py-3 px-2 font-medium">重试</th>
                      <th className="text-left py-3 px-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-b hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-2">
                          <Badge className={getStatusColor(task.status)}>
                            {STATUS_LABELS[task.status] || task.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 max-w-[140px]">
                          <span className="truncate block" title={task.page?.pageName}>
                            {task.page?.pageName || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-2 max-w-[180px]">
                          <span className="truncate block" title={task.video?.title}>
                            {task.video?.title || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-2 max-w-[140px]">
                          <span className="truncate block" title={task.variant?.variantName}>
                            {task.variant?.variantName || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          {formatDate(task.scheduledAt)}
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap text-muted-foreground">
                          {task.publishedAt ? formatDate(task.publishedAt) : '-'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {task.retryCount > 0 ? (
                            <span className="text-orange-600">{task.retryCount}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1">
                            {task.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  disabled={actionLoading === task.id}
                                  onClick={() => handlePublishNow(task.id)}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  立即发布
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  disabled={actionLoading === task.id}
                                  onClick={() => handleCancel(task.id)}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  取消
                                </Button>
                              </>
                            )}
                            {task.status === 'FAILED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                disabled={actionLoading === task.id}
                                onClick={() => handleRetry(task.id)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                重试
                              </Button>
                            )}
                            {task.status !== 'PROCESSING' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                disabled={actionLoading === task.id}
                                onClick={() => handleDelete(task.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                删除
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    第 {page} / {totalPages} 页
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

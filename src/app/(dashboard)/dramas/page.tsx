'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatDate, formatNumber, getStatusColor } from '@/lib/utils'
import {
  Archive,
  BookOpen,
  DollarSign,
  Eye,
  ImageIcon,
  Layers,
  Link as LinkIcon,
  ListTodo,
  MousePointerClick,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Video,
} from 'lucide-react'

interface Drama {
  id: string
  dramaName: string
  description: string | null
  coverUrl: string | null
  language: string
  tags: string[]
  cpsBaseUrl: string | null
  status: 'ACTIVE' | 'ARCHIVED' | 'BANNED'
  createdAt: string
  updatedAt: string
  stats: {
    views: number
    clicks: number
    conversions: number
    revenue: number
  }
  _count: {
    videos: number
    variants: number
    publishTasks: number
    performanceLogs: number
  }
}

const emptyForm = {
  dramaName: '',
  description: '',
  coverUrl: '',
  language: 'zh',
  tags: '',
  cpsBaseUrl: '',
  status: 'ACTIVE',
}

const statusLabels: Record<Drama['status'], string> = {
  ACTIVE: '启用',
  ARCHIVED: '已归档',
  BANNED: '已封禁',
}

export default function DramasPage() {
  const [dramas, setDramas] = useState<Drama[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDrama, setEditingDrama] = useState<Drama | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDramas()
  }, [statusFilter])

  const fetchDramas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: '100' })
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/dramas?${params.toString()}`)
      const result = await response.json()
      if (result.success) {
        setDramas(result.data.dramas)
      } else {
        toast({ title: '错误', description: result.error?.message || '获取剧集列表失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '获取剧集列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingDrama(null)
    setForm(emptyForm)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (drama: Drama) => {
    setEditingDrama(drama)
    setForm({
      dramaName: drama.dramaName,
      description: drama.description || '',
      coverUrl: drama.coverUrl || '',
      language: drama.language,
      tags: drama.tags.join(', '),
      cpsBaseUrl: drama.cpsBaseUrl || '',
      status: drama.status,
    })
    setIsDialogOpen(true)
  }

  const buildPayload = () => {
    const body: Record<string, unknown> = {
      dramaName: form.dramaName.trim(),
      language: form.language,
      status: form.status,
      tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    }
    if (form.description.trim()) body.description = form.description.trim()
    if (form.coverUrl.trim()) body.coverUrl = form.coverUrl.trim()
    if (form.cpsBaseUrl.trim()) body.cpsBaseUrl = form.cpsBaseUrl.trim()
    return body
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.dramaName.trim()) {
      toast({ title: '错误', description: '请填写剧集名称', variant: 'destructive' })
      return
    }

    try {
      setSubmitting(true)
      const url = editingDrama ? `/api/dramas/${editingDrama.id}` : '/api/dramas'
      const method = editingDrama ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: '成功', description: editingDrama ? '剧集已更新' : '剧集已创建' })
        setIsDialogOpen(false)
        fetchDramas()
      } else {
        toast({ title: '错误', description: result.error?.message || '操作失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '操作失败', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (drama: Drama, status: Drama['status']) => {
    try {
      setActionId(drama.id)
      const response = await fetch(`/api/dramas/${drama.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: '成功', description: status === 'ACTIVE' ? '剧集已恢复启用' : '剧集已归档' })
        fetchDramas()
      } else {
        toast({ title: '错误', description: result.error?.message || '状态更新失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '状态更新失败', variant: 'destructive' })
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (drama: Drama) => {
    if (!confirm(`确定要删除剧集「${drama.dramaName}」吗？此操作不可撤销。`)) return

    try {
      setActionId(drama.id)
      const response = await fetch(`/api/dramas/${drama.id}`, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        toast({ title: '成功', description: '剧集已删除' })
        fetchDramas()
      } else {
        toast({ title: '错误', description: result.error?.message || '删除失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '操作失败', variant: 'destructive' })
    } finally {
      setActionId(null)
    }
  }

  const filteredDramas = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) return dramas

    return dramas.filter(drama =>
      drama.dramaName.toLowerCase().includes(keyword) ||
      (drama.description || '').toLowerCase().includes(keyword) ||
      drama.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }, [dramas, searchQuery])

  const totals = useMemo(() => {
    return dramas.reduce(
      (acc, drama) => ({
        videos: acc.videos + drama._count.videos,
        variants: acc.variants + drama._count.variants,
        views: acc.views + (drama.stats?.views || 0),
        revenue: acc.revenue + (drama.stats?.revenue || 0),
      }),
      { videos: 0, variants: 0, views: 0, revenue: 0 }
    )
  }, [dramas])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">剧集管理</h1>
          <p className="text-muted-foreground">管理剧集资料、CPS 链接和关联素材表现</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDramas} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={handleOpenAdd}>
            <Plus className="mr-2 h-4 w-4" />
            新建剧集
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">剧集数量</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dramas.length)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">视频素材</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totals.videos)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计播放</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totals.views)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计收益</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索剧集、简介或标签..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="ACTIVE">启用</SelectItem>
            <SelectItem value="ARCHIVED">已归档</SelectItem>
            <SelectItem value="BANNED">已封禁</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">加载中...</div>
      ) : filteredDramas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">暂无剧集</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? '未找到匹配的剧集' : '点击「新建剧集」开始添加'}
            </p>
            {!searchQuery && (
              <Button onClick={handleOpenAdd}>
                <Plus className="mr-2 h-4 w-4" />
                新建剧集
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDramas.map(drama => (
            <Card key={drama.id} className="overflow-hidden">
              <div className="aspect-[16/9] bg-muted">
                {drama.coverUrl ? (
                  <img
                    src={drama.coverUrl}
                    alt={drama.dramaName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-6 line-clamp-2">{drama.dramaName}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">更新于 {formatDate(drama.updatedAt)}</p>
                  </div>
                  <Badge className={`${getStatusColor(drama.status)} shrink-0`}>
                    {statusLabels[drama.status]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {drama.description ? (
                  <p className="min-h-10 text-sm text-muted-foreground line-clamp-2">{drama.description}</p>
                ) : (
                  <p className="min-h-10 text-sm text-muted-foreground">暂无简介</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{drama.language}</Badge>
                  {drama.tags.slice(0, 4).map((tag, i) => (
                    <Badge key={`${tag}-${i}`} variant="secondary">{tag}</Badge>
                  ))}
                  {drama.tags.length > 4 && (
                    <Badge variant="outline">+{drama.tags.length - 4}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">视频</p>
                    <p className="font-medium">{formatNumber(drama._count.videos)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">剪辑</p>
                    <p className="font-medium">{formatNumber(drama._count.variants)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">任务</p>
                    <p className="font-medium">{formatNumber(drama._count.publishTasks)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t pt-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{formatNumber(drama.stats?.views || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{formatNumber(drama.stats?.clicks || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{formatCurrency(drama.stats?.revenue || 0)}</span>
                  </div>
                </div>

                {drama.cpsBaseUrl && (
                  <div className="flex items-center gap-2 truncate text-xs text-muted-foreground" title={drama.cpsBaseUrl}>
                    <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{drama.cpsBaseUrl}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      title="编辑"
                      onClick={() => handleOpenEdit(drama)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {drama.status === 'ACTIVE' ? (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        title="归档"
                        disabled={actionId === drama.id}
                        onClick={() => handleStatusChange(drama, 'ARCHIVED')}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        title="恢复启用"
                        disabled={actionId === drama.id}
                        onClick={() => handleStatusChange(drama, 'ACTIVE')}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title="删除"
                      disabled={actionId === drama.id}
                      onClick={() => handleDelete(drama)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{formatNumber(drama._count.variants)}</span>
                    <span className="flex items-center gap-1"><ListTodo className="h-3.5 w-3.5" />{formatNumber(drama._count.publishTasks)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDrama ? '编辑剧集' : '新建剧集'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>剧集名称 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="输入剧集名称"
                value={form.dramaName}
                onChange={e => setForm(f => ({ ...f, dramaName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>简介</Label>
              <Input
                placeholder="剧集简介（可选）"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>封面图链接</Label>
              <Input
                placeholder="https://example.com/cover.jpg"
                value={form.coverUrl}
                onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>语言</Label>
                <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>状态</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">启用</SelectItem>
                    <SelectItem value="ARCHIVED">已归档</SelectItem>
                    <SelectItem value="BANNED">已封禁</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>CPS 链接</Label>
              <Input
                placeholder="https://example.com/cps（可选）"
                value={form.cpsBaseUrl}
                onChange={e => setForm(f => ({ ...f, cpsBaseUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>标签（逗号分隔）</Label>
              <Input
                placeholder="剧情, 爱情, 古装"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : (editingDrama ? '保存修改' : '创建剧集')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

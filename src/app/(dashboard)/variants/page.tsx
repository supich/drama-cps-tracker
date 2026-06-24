'use client'

import { useEffect, useState } from 'react'
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
import { formatNumber, getStatusColor, formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { CalendarPlus, Layers, Plus, Search, Play, Tag, Video } from 'lucide-react'
import Link from 'next/link'

interface VariantData {
  id: string
  variantName: string
  title: string
  caption: string | null
  coverUrl: string | null
  hookType: string | null
  ctaType: string | null
  hashtags: string[]
  status: string
  createdAt: string
  video: {
    id: string
    title: string
    drama: {
      id: string
      dramaName: string
    }
  }
  _count: {
    publishTasks: number
    performanceLogs: number
  }
}

interface VideoOption {
  id: string
  title: string
  coverUrl: string | null
  language: string
  tags: string[]
  drama: {
    dramaName: string
  }
}

const emptyForm = {
  videoId: '',
  variantName: '',
  title: '',
  caption: '',
  coverUrl: '',
  hookType: '',
  ctaType: '',
  hashtags: '',
  status: 'READY',
}

export default function VariantsPage() {
  const [variants, setVariants] = useState<VariantData[]>([])
  const [videos, setVideos] = useState<VideoOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<VariantData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const { toast } = useToast()

  useEffect(() => {
    fetchVariants()
  }, [])

  const fetchVariants = async () => {
    try {
      setLoading(true)
      const [variantsRes, videosRes] = await Promise.all([
        fetch('/api/variants?limit=100'),
        fetch('/api/videos?limit=100'),
      ])
      const [variantsResult, videosResult] = await Promise.all([
        variantsRes.json(),
        videosRes.json(),
      ])

      if (variantsResult.success) {
        setVariants(variantsResult.data.variants)
      }
      if (videosResult.success) {
        setVideos(videosResult.data.videos)
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '获取剪辑版本失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setForm(emptyForm)
    setIsDialogOpen(true)
  }

  const handleVideoChange = (videoId: string) => {
    const video = videos.find(item => item.id === videoId)
    setForm(prev => ({
      ...prev,
      videoId,
      title: prev.title || video?.title || '',
      coverUrl: prev.coverUrl || video?.coverUrl || '',
      hashtags: prev.hashtags || (video?.tags || []).join(', '),
    }))
  }

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.videoId || !form.variantName.trim() || !form.title.trim()) {
      toast({ title: '错误', description: '请选择视频，并填写版本名称和发布标题', variant: 'destructive' })
      return
    }

    try {
      setSubmitting(true)
      const body: Record<string, unknown> = {
        videoId: form.videoId,
        variantName: form.variantName.trim(),
        title: form.title.trim(),
        status: form.status,
        hashtags: form.hashtags.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean),
      }
      if (form.caption.trim()) body.caption = form.caption.trim()
      if (form.coverUrl.trim()) body.coverUrl = form.coverUrl.trim()
      if (form.hookType.trim()) body.hookType = form.hookType.trim()
      if (form.ctaType.trim()) body.ctaType = form.ctaType.trim()

      const response = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: '成功', description: '剪辑版本已创建' })
        setIsDialogOpen(false)
        fetchVariants()
      } else {
        toast({ title: '错误', description: result.error?.message || '创建失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '创建剪辑版本失败', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredVariants = variants.filter(variant => {
    const matchesSearch = variant.variantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          variant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          variant.video.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || variant.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">剪辑版本管理</h1>
          <p className="text-muted-foreground">
            管理视频的不同剪辑版本
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建版本
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索剪辑版本..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="DRAFT">草稿</SelectItem>
            <SelectItem value="READY">已就绪</SelectItem>
            <SelectItem value="PUBLISHED">已发布</SelectItem>
            <SelectItem value="ARCHIVED">已归档</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Variants List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">正在加载剪辑版本...</div>
        </div>
      ) : filteredVariants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">未找到剪辑版本</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? '请尝试其他搜索内容' : '创建您的第一个剪辑版本开始使用'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVariants.map((variant) => (
            <Card key={variant.id} className="overflow-hidden">
              {/* Variant Thumbnail */}
              <div className="aspect-video bg-muted relative">
                {variant.coverUrl ? (
                  <img
                    src={variant.coverUrl}
                    alt={variant.variantName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-blue-500 text-white">
                    {variant.video.title.split(' - ')[0]}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{variant.variantName}</CardTitle>
                  <Badge className={getStatusColor(variant.status)}>
                    {variant.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {variant.title}
                </p>

                <div className="flex flex-wrap gap-2">
                  {variant.hookType && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {variant.hookType}
                    </Badge>
                  )}
                  {variant.ctaType && (
                    <Badge variant="outline">
                      {variant.ctaType}
                    </Badge>
                  )}
                </div>

                {variant.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {variant.hashtags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-xs text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                    {variant.hashtags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{variant.hashtags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">发布任务</p>
                    <p className="font-medium">{variant._count.publishTasks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">剧集</p>
                    <p className="font-medium text-xs line-clamp-1">
                      {variant.video.drama.dramaName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Video className="h-3 w-3" />
                  {formatDate(variant.createdAt)}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedVariant(variant)}>
                    查看详情
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/scheduler?variantId=${variant.id}`}>
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      发布
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建剪辑版本</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateVariant} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>所属视频 <span className="text-red-500">*</span></Label>
              <Select value={form.videoId} onValueChange={handleVideoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择视频" />
                </SelectTrigger>
                <SelectContent>
                  {videos.map(video => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.title} - {video.drama.dramaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {videos.length === 0 && (
                <p className="text-xs text-muted-foreground">暂无视频，请先在视频管理中创建视频。</p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>版本名称 <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="如 高冲突开头 / A版"
                  value={form.variantName}
                  onChange={e => setForm(f => ({ ...f, variantName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>状态</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="READY">已就绪</SelectItem>
                    <SelectItem value="DRAFT">草稿</SelectItem>
                    <SelectItem value="ARCHIVED">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>发布标题 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="发布到 Facebook 时使用的标题"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>发布文案</Label>
              <Input
                placeholder="视频正文文案（可选）"
                value={form.caption}
                onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
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
                <Label>Hook 类型</Label>
                <Input
                  placeholder="悬念 / 情感 / 冲突"
                  value={form.hookType}
                  onChange={e => setForm(f => ({ ...f, hookType: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>CTA 类型</Label>
                <Input
                  placeholder="立即观看 / 免费看"
                  value={form.ctaType}
                  onChange={e => setForm(f => ({ ...f, ctaType: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>话题标签（逗号分隔）</Label>
              <Input
                placeholder="drama, romance, episode1"
                value={form.hashtags}
                onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button type="submit" disabled={submitting || videos.length === 0}>
                {submitting ? '创建中...' : '创建版本'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <VariantDetailDialog
        variant={selectedVariant}
        open={!!selectedVariant}
        onOpenChange={(open) => {
          if (!open) setSelectedVariant(null)
        }}
        onSaved={() => {
          setSelectedVariant(null)
          fetchVariants()
        }}
      />
    </div>
  )
}

function VariantDetailDialog({
  variant,
  open,
  onOpenChange,
  onSaved,
}: {
  variant: VariantData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [editForm, setEditForm] = useState({
    variantName: '',
    title: '',
    caption: '',
    coverUrl: '',
    hookType: '',
    ctaType: '',
    hashtags: '',
    status: 'READY',
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!variant) return
    setEditForm({
      variantName: variant.variantName,
      title: variant.title,
      caption: variant.caption || '',
      coverUrl: variant.coverUrl || '',
      hookType: variant.hookType || '',
      ctaType: variant.ctaType || '',
      hashtags: variant.hashtags.join(', '),
      status: variant.status,
    })
  }, [variant])

  if (!variant) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.variantName.trim() || !editForm.title.trim()) {
      toast({ title: '错误', description: '请填写版本名称和发布标题', variant: 'destructive' })
      return
    }

    try {
      setSaving(true)
      const body: Record<string, unknown> = {
        variantName: editForm.variantName.trim(),
        title: editForm.title.trim(),
        caption: editForm.caption.trim(),
        coverUrl: editForm.coverUrl.trim(),
        hookType: editForm.hookType.trim(),
        ctaType: editForm.ctaType.trim(),
        status: editForm.status,
        hashtags: editForm.hashtags.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean),
      }

      const response = await fetch(`/api/variants/${variant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: '成功', description: '剪辑版本已更新' })
        onSaved()
      } else {
        toast({ title: '错误', description: result.error?.message || '保存失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '保存剪辑版本失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>剪辑版本详情</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="aspect-video overflow-hidden rounded-md bg-muted">
            {editForm.coverUrl ? (
              <img
                src={editForm.coverUrl}
                alt={editForm.variantName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getStatusColor(variant.status)}>{variant.status}</Badge>
            <Badge variant="outline">{variant.video.title}</Badge>
            <Badge variant="secondary">{variant.video.drama.dramaName}</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>版本名称 <span className="text-red-500">*</span></Label>
              <Input
                value={editForm.variantName}
                onChange={e => setEditForm(f => ({ ...f, variantName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>状态</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="READY">已就绪</SelectItem>
                  <SelectItem value="DRAFT">草稿</SelectItem>
                  <SelectItem value="PUBLISHED">已发布</SelectItem>
                  <SelectItem value="ARCHIVED">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>发布标题 <span className="text-red-500">*</span></Label>
            <Input
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label>发布文案</Label>
            <Input
              value={editForm.caption}
              onChange={e => setEditForm(f => ({ ...f, caption: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label>封面图链接</Label>
            <Input
              value={editForm.coverUrl}
              onChange={e => setEditForm(f => ({ ...f, coverUrl: e.target.value }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Hook 类型</Label>
              <Input
                value={editForm.hookType}
                onChange={e => setEditForm(f => ({ ...f, hookType: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>CTA 类型</Label>
              <Input
                value={editForm.ctaType}
                onChange={e => setEditForm(f => ({ ...f, ctaType: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>话题标签（逗号分隔）</Label>
            <Input
              value={editForm.hashtags}
              onChange={e => setEditForm(f => ({ ...f, hashtags: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">发布任务</p>
              <p className="font-medium">{formatNumber(variant._count.publishTasks)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">数据记录</p>
              <p className="font-medium">{formatNumber(variant._count.performanceLogs)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">创建时间</p>
              <p className="font-medium">{formatDate(variant.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">视频 ID</p>
              <p className="font-mono text-xs truncate">{variant.video.id}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
            <Button type="submit" disabled={saving}>{saving ? '保存中...' : '保存修改'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

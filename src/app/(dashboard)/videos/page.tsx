'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatNumber, getStatusColor, formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { CalendarPlus, Video, Plus, Search, Play, Clock } from 'lucide-react'
import Link from 'next/link'

interface VideoData {
  id: string
  title: string
  description: string | null
  fileUrl: string
  coverUrl: string | null
  duration: number | null
  language: string
  tags: string[]
  status: string
  createdAt: string
  drama: {
    id: string
    dramaName: string
  }
  _count: {
    variants: number
    publishTasks: number
    performanceLogs: number
  }
}

interface Drama {
  id: string
  dramaName: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null)
  const [dramas, setDramas] = useState<Drama[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    dramaId: '',
    title: '',
    description: '',
    fileUrl: '',
    coverUrl: '',
    duration: '',
    language: 'zh',
    tags: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/videos')
      const result = await response.json()

      if (result.success) {
        setVideos(result.data.videos)
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '获取视频列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDramas = async () => {
    try {
      const response = await fetch('/api/dramas?limit=100')
      const result = await response.json()
      if (result.success) setDramas(result.data.dramas)
    } catch {}
  }

  const handleOpenUpload = () => {
    fetchDramas()
    setForm({ dramaId: '', title: '', description: '', fileUrl: '', coverUrl: '', duration: '', language: 'zh', tags: '' })
    setIsUploadOpen(true)
  }

  const handleOpenDetails = (video: VideoData) => {
    fetchDramas()
    setSelectedVideo(video)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.dramaId || !form.title || !form.fileUrl) {
      toast({ title: '错误', description: '请填写必填项（剧集、标题、视频链接）', variant: 'destructive' })
      return
    }
    try {
      setSubmitting(true)
      const body: Record<string, unknown> = {
        dramaId: form.dramaId,
        title: form.title,
        fileUrl: form.fileUrl,
        language: form.language,
      }
      if (form.description) body.description = form.description
      if (form.coverUrl) body.coverUrl = form.coverUrl
      if (form.duration) body.duration = parseInt(form.duration)
      if (form.tags) body.tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()
      if (result.success) {
        toast({ title: '成功', description: '视频已创建' })
        setIsUploadOpen(false)
        fetchVideos()
      } else {
        toast({ title: '错误', description: result.error?.message || '创建失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '操作失败', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          video.drama.dramaName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">视频管理</h1>
          <p className="text-muted-foreground">
            管理您的视频素材
          </p>
        </div>
        <Button onClick={handleOpenUpload}>
          <Plus className="mr-2 h-4 w-4" />
          上传视频
        </Button>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>上传视频</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>所属剧集 <span className="text-red-500">*</span></Label>
              <Select value={form.dramaId} onValueChange={v => setForm(f => ({ ...f, dramaId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择剧集" />
                </SelectTrigger>
                <SelectContent>
                  {dramas.length === 0 && (
                    <SelectItem value="__none" disabled>暂无剧集，请先创建剧集</SelectItem>
                  )}
                  {dramas.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.dramaName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>视频标题 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="输入视频标题"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>视频链接 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="https://example.com/video.mp4"
                value={form.fileUrl}
                onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
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
            <div className="space-y-1">
              <Label>描述</Label>
              <Input
                placeholder="视频简介（可选）"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>时长（秒）</Label>
                <Input
                  type="number"
                  placeholder="如 120"
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  min={1}
                />
              </div>
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
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>取消</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '创建中...' : '创建视频'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索视频..."
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
            <SelectItem value="ARCHIVED">已归档</SelectItem>
            <SelectItem value="BANNED">已封禁</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Videos List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">正在加载视频...</div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">未找到视频</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? '请尝试其他搜索内容' : '上传您的第一个视频开始使用'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              {/* Video Thumbnail */}
              <div className="aspect-video bg-muted relative">
                {video.coverUrl ? (
                  <img
                    src={video.coverUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                  <Badge className={getStatusColor(video.status)}>
                    {video.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  剧集：{video.drama.dramaName}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{video.language}</Badge>
                  {video.tags.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">剪辑版本</p>
                    <p className="font-medium">{video._count.variants}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">发布任务</p>
                    <p className="font-medium">{video._count.publishTasks}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(video.createdAt)}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDetails(video)}>
                    查看详情
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/scheduler?videoId=${video.id}`}>
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

      <VideoDetailDialog
        video={selectedVideo}
        dramas={dramas}
        open={!!selectedVideo}
        onOpenChange={(open) => {
          if (!open) setSelectedVideo(null)
        }}
        onSaved={() => {
          setSelectedVideo(null)
          fetchVideos()
        }}
      />
    </div>
  )
}

function VideoDetailDialog({
  video,
  dramas,
  open,
  onOpenChange,
  onSaved,
}: {
  video: VideoData | null
  dramas: Drama[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [editForm, setEditForm] = useState({
    dramaId: '',
    title: '',
    description: '',
    fileUrl: '',
    coverUrl: '',
    duration: '',
    language: 'zh',
    tags: '',
    status: 'READY',
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!video) return
    setEditForm({
      dramaId: video.drama.id,
      title: video.title,
      description: video.description || '',
      fileUrl: video.fileUrl,
      coverUrl: video.coverUrl || '',
      duration: video.duration ? String(video.duration) : '',
      language: video.language || 'zh',
      tags: video.tags.join(', '),
      status: video.status,
    })
  }, [video])

  if (!video) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.dramaId || !editForm.title.trim() || !editForm.fileUrl.trim()) {
      toast({ title: '错误', description: '请填写剧集、标题和视频链接', variant: 'destructive' })
      return
    }

    try {
      setSaving(true)
      const body: Record<string, unknown> = {
        dramaId: editForm.dramaId,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        fileUrl: editForm.fileUrl.trim(),
        coverUrl: editForm.coverUrl.trim(),
        language: editForm.language,
        status: editForm.status,
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      }
      if (editForm.duration.trim()) body.duration = parseInt(editForm.duration, 10)

      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: '成功', description: '视频已更新' })
        onSaved()
      } else {
        toast({ title: '错误', description: result.error?.message || '保存失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '保存视频失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>视频详情</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="aspect-video overflow-hidden rounded-md bg-muted">
            {editForm.coverUrl ? (
              <img src={editForm.coverUrl} alt={editForm.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>所属剧集 <span className="text-red-500">*</span></Label>
              <Select value={editForm.dramaId} onValueChange={v => setEditForm(f => ({ ...f, dramaId: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dramas.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.dramaName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>状态</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">草稿</SelectItem>
                  <SelectItem value="READY">已就绪</SelectItem>
                  <SelectItem value="ARCHIVED">已归档</SelectItem>
                  <SelectItem value="BANNED">已封禁</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>视频标题 <span className="text-red-500">*</span></Label>
            <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div className="space-y-1">
            <Label>视频链接 <span className="text-red-500">*</span></Label>
            <Input value={editForm.fileUrl} onChange={e => setEditForm(f => ({ ...f, fileUrl: e.target.value }))} />
          </div>

          <div className="space-y-1">
            <Label>封面图链接</Label>
            <Input value={editForm.coverUrl} onChange={e => setEditForm(f => ({ ...f, coverUrl: e.target.value }))} />
          </div>

          <div className="space-y-1">
            <Label>描述</Label>
            <Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>时长（秒）</Label>
              <Input
                type="number"
                min={1}
                value={editForm.duration}
                onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>语言</Label>
              <Select value={editForm.language} onValueChange={v => setEditForm(f => ({ ...f, language: v }))}>
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
          </div>

          <div className="space-y-1">
            <Label>标签（逗号分隔）</Label>
            <Input value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">剪辑版本</p>
              <p className="font-medium">{formatNumber(video._count.variants)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">发布任务</p>
              <p className="font-medium">{formatNumber(video._count.publishTasks)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">创建时间</p>
              <p className="font-medium">{formatDate(video.createdAt)}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit" disabled={saving}>{saving ? '保存中...' : '保存修改'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

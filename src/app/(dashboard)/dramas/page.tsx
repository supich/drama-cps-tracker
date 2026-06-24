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
import { useToast } from '@/components/ui/use-toast'
import { BookOpen, Plus, Search, RefreshCw, Pencil, Trash2 } from 'lucide-react'

interface Drama {
  id: string
  dramaName: string
  description: string | null
  language: string
  tags: string[]
  cpsBaseUrl: string | null
  createdAt: string
  updatedAt: string
  _count: { videos: number }
}

const emptyForm = {
  dramaName: '',
  description: '',
  language: 'zh',
  tags: '',
  cpsBaseUrl: '',
}

export default function DramasPage() {
  const [dramas, setDramas] = useState<Drama[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDrama, setEditingDrama] = useState<Drama | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDramas()
  }, [])

  const fetchDramas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dramas?limit=100')
      const result = await response.json()
      if (result.success) setDramas(result.data.dramas)
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
      language: drama.language,
      tags: drama.tags.join(', '),
      cpsBaseUrl: drama.cpsBaseUrl || '',
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.dramaName.trim()) {
      toast({ title: '错误', description: '请填写剧集名称', variant: 'destructive' })
      return
    }
    try {
      setSubmitting(true)
      const body: Record<string, unknown> = {
        dramaName: form.dramaName.trim(),
        language: form.language,
      }
      if (form.description) body.description = form.description.trim()
      if (form.cpsBaseUrl) body.cpsBaseUrl = form.cpsBaseUrl.trim()
      if (form.tags) body.tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)

      const url = editingDrama ? `/api/dramas/${editingDrama.id}` : '/api/dramas'
      const method = editingDrama ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const handleDelete = async (drama: Drama) => {
    if (!confirm(`确定要删除剧集「${drama.dramaName}」吗？此操作不可撤销。`)) return
    try {
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
    }
  }

  const filtered = dramas.filter(d =>
    d.dramaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">剧集管理</h1>
          <p className="text-muted-foreground">管理所有剧集及其视频素材</p>
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索剧集..."
          className="pl-9"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">加载中...</div>
      ) : filtered.length === 0 ? (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(drama => (
            <Card key={drama.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{drama.dramaName}</CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleOpenEdit(drama)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(drama)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {drama.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{drama.description}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{drama.language}</Badge>
                  {drama.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                {drama.cpsBaseUrl && (
                  <p className="text-xs text-muted-foreground truncate" title={drama.cpsBaseUrl}>
                    CPS: {drama.cpsBaseUrl}
                  </p>
                )}
                <div className="pt-1 text-sm">
                  <span className="text-muted-foreground">视频数量：</span>
                  <span className="font-medium">{drama._count.videos}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
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

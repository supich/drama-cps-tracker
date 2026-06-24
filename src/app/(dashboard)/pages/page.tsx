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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { formatNumber, getStatusColor, getHealthScoreColor } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { Facebook, Pencil, Plus, Search, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'

interface FacebookPage {
  id: string
  pageId: string
  pageName: string
  accessToken: string
  tokenExpiresAt: string | null
  status: string
  niche: string | null
  region: string | null
  language: string
  timezone: string
  fansCount: number
  dailyPostLimit: number
  todayPostCount: number
  healthScore: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export default function PagesPage() {
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<FacebookPage | null>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    fetchPages()
  }, [])
  
  const fetchPages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pages')
      const result = await response.json()
      
      if (result.success) {
        setPages(result.data.pages)
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '获取主页列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const filteredPages = pages.filter(page => {
    const matchesSearch = page.pageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          page.pageId.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter
    return matchesSearch && matchesStatus
  })
  
  const handlePausePage = async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}/pause`, { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        toast({ title: '成功', description: '主页已暂停' })
        fetchPages()
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '暂停主页失败',
        variant: 'destructive',
      })
    }
  }
  
  const handleResumePage = async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}/resume`, { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        toast({ title: '成功', description: '主页已恢复运行' })
        fetchPages()
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '恢复主页失败',
        variant: 'destructive',
      })
    }
  }

  const handleValidateToken = async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}/validate-token`, { method: 'POST' })
      const result = await response.json()

      if (result.success) {
        const scopes = result.data.scopes?.join(', ') || '未返回权限列表'
        toast({
          title: result.data.isValid ? 'Token 有效' : 'Token 无效',
          description: result.data.message || `权限：${scopes}`,
          variant: result.data.isValid ? undefined : 'destructive',
        })
        fetchPages()
      } else {
        toast({
          title: 'Token 验证失败',
          description: result.error?.message || '无法验证主页 Token',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Token 验证失败',
        description: '无法验证主页 Token',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePage = async (page: FacebookPage) => {
    const confirmed = window.confirm(`确定删除主页「${page.pageName}」吗？删除后会清空保存的访问令牌。`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/pages/${page.id}`, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        toast({ title: '成功', description: '主页已删除' })
        fetchPages()
      } else {
        toast({
          title: '删除失败',
          description: result.error?.message || '无法删除主页',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: '删除失败',
        description: '无法删除主页',
        variant: 'destructive',
      })
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facebook 主页管理</h1>
          <p className="text-muted-foreground">
            管理用于发布的 Facebook 主页
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加主页
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索主页..."
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
            <SelectItem value="ACTIVE">正常</SelectItem>
            <SelectItem value="PAUSED">已暂停</SelectItem>
            <SelectItem value="WARNING">预警</SelectItem>
            <SelectItem value="RESTRICTED">受限</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchPages}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Pages List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">正在加载主页...</div>
        </div>
      ) : filteredPages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Facebook className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">未找到主页</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? '请尝试其他搜索内容' : '添加您的第一个 Facebook 主页开始使用'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <Card key={page.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{page.pageName}</CardTitle>
                    <p className="text-sm text-muted-foreground">ID: {page.pageId}</p>
                  </div>
                  <Badge className={getStatusColor(page.status)}>
                    {page.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Page Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">粉丝数</p>
                    <p className="font-medium">{formatNumber(page.fansCount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">健康度</p>
                    <p className={`font-medium ${getHealthScoreColor(page.healthScore)}`}>
                      {page.healthScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">今日发布</p>
                    <p className="font-medium">
                      {page.todayPostCount}/{page.dailyPostLimit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">语言</p>
                    <p className="font-medium">{page.language}</p>
                  </div>
                </div>
                
                {/* Tags */}
                {page.niche && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{page.niche}</Badge>
                    {page.region && <Badge variant="outline">{page.region}</Badge>}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {page.status === 'ACTIVE' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePausePage(page.id)}
                    >
                      暂停
                    </Button>
                  ) : page.status === 'PAUSED' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleResumePage(page.id)}
                    >
                      恢复
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => handleValidateToken(page.id)}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    验证Token
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingPage(page)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    编辑
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeletePage(page)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Page Dialog */}
      <AddPageDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        existingPages={pages}
        onSuccess={fetchPages}
      />
      <EditPageDialog
        page={editingPage}
        open={!!editingPage}
        onOpenChange={(open) => {
          if (!open) setEditingPage(null)
        }}
        onSuccess={fetchPages}
      />
    </div>
  )
}

interface DiscoveredPage {
  pageId: string
  pageName: string
  accessToken: string
  category?: string
  tasks: string[]
}

interface AddPageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingPages: FacebookPage[]
  onSuccess: () => void
}

function AddPageDialog({ open, onOpenChange, existingPages, onSuccess }: AddPageDialogProps) {
  const [userAccessToken, setUserAccessToken] = useState('')
  const [discovering, setDiscovering] = useState(false)
  const [exchangingToken, setExchangingToken] = useState(false)
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([])
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    pageId: '',
    pageName: '',
    accessToken: '',
    niche: '',
    region: '',
    language: 'en',
    timezone: 'America/New_York',
    dailyPostLimit: 10,
  })
  const [loading, setLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const { toast } = useToast()
  const existingPageIds = new Set(existingPages.map(page => page.pageId))

  const resetForm = () => {
    setUserAccessToken('')
    setDiscoveredPages([])
    setSelectedPageIds([])
    setFormData({
      pageId: '',
      pageName: '',
      accessToken: '',
      niche: '',
      region: '',
      language: 'en',
      timezone: 'America/New_York',
      dailyPostLimit: 10,
    })
  }

  const handleDiscoverPages = async () => {
    if (!userAccessToken.trim()) {
      toast({ title: '错误', description: '请先粘贴用户访问口令', variant: 'destructive' })
      return
    }

    try {
      setDiscovering(true)
      const response = await fetch('/api/pages/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAccessToken: userAccessToken.trim() }),
      })
      const result = await response.json()

      if (result.success) {
        setDiscoveredPages(result.data.pages)
        setSelectedPageIds(result.data.pages.map((page: DiscoveredPage) => page.pageId))
        toast({ title: '成功', description: `获取到 ${result.data.pages.length} 个主页` })
      } else {
        toast({ title: '错误', description: result.error?.message || '获取主页失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '错误', description: '获取主页失败', variant: 'destructive' })
    } finally {
      setDiscovering(false)
    }
  }

  const handleExchangeUserToken = async () => {
    if (!userAccessToken.trim()) {
      toast({ title: '错误', description: '请先粘贴用户访问口令', variant: 'destructive' })
      return
    }

    try {
      setExchangingToken(true)
      const response = await fetch('/api/pages/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAccessToken: userAccessToken.trim() }),
      })
      const result = await response.json()

      if (result.success) {
        setUserAccessToken(result.data.accessToken)
        setDiscoveredPages([])
        setSelectedPageIds([])
        toast({
          title: '转换成功',
          description: result.data.expiresAt
            ? `长期口令有效期至 ${new Date(result.data.expiresAt).toLocaleString('zh-CN')}`
            : '已转换为长期用户口令',
        })
      } else {
        toast({
          title: '转换失败',
          description: result.error?.message || '无法转换长期用户口令',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: '转换失败', description: '无法转换长期用户口令', variant: 'destructive' })
    } finally {
      setExchangingToken(false)
    }
  }

  const handleSelectDiscoveredPage = (page: DiscoveredPage) => {
    setFormData(current => ({
      ...current,
      pageId: page.pageId,
      pageName: page.pageName,
      accessToken: page.accessToken,
      niche: current.niche || page.category || '',
    }))
  }

  const toggleSelectedPage = (pageId: string, checked: boolean | string) => {
    setSelectedPageIds(current => {
      if (checked) return current.includes(pageId) ? current : [...current, pageId]
      return current.filter(id => id !== pageId)
    })
  }

  const buildPagePayload = (page: DiscoveredPage) => ({
    pageId: page.pageId,
    pageName: page.pageName,
    accessToken: page.accessToken,
    niche: page.category || '',
    region: formData.region,
    language: formData.language,
    timezone: formData.timezone,
    dailyPostLimit: formData.dailyPostLimit,
  })

  const handleBatchSubmit = async () => {
    const selectedPages = discoveredPages.filter(page => selectedPageIds.includes(page.pageId))
    if (selectedPages.length === 0) {
      toast({ title: '错误', description: '请至少选择一个主页', variant: 'destructive' })
      return
    }

    try {
      setBatchLoading(true)
      const results = await Promise.all(selectedPages.map(async page => {
        const response = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPagePayload(page)),
        })
        const result = await response.json()
        return {
          page,
          ok: result.success,
          error: result.error?.message,
          existed: existingPageIds.has(page.pageId),
        }
      }))

      const successCount = results.filter(result => result.ok).length
      const updateCount = results.filter(result => result.ok && result.existed).length
      const addCount = successCount - updateCount
      const failures = results.filter(result => !result.ok)

      if (successCount > 0) {
        toast({
          title: failures.length > 0 ? '部分完成' : '成功',
          description: `新增 ${addCount} 个主页，更新 ${updateCount} 个主页 Token${failures.length ? `，失败 ${failures.length} 个` : ''}`,
          variant: failures.length > 0 ? 'destructive' : undefined,
        })
        onSuccess()
      }

      if (failures.length === 0) {
        onOpenChange(false)
        resetForm()
      } else if (successCount === 0) {
        toast({
          title: '批量处理失败',
          description: failures.slice(0, 3).map(item => `${item.page.pageName}: ${item.error || '未知错误'}`).join('；'),
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: '错误', description: '批量添加或更新主页失败', variant: 'destructive' })
    } finally {
      setBatchLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: '成功',
          description: existingPageIds.has(formData.pageId) ? '主页 Token 已更新' : '主页添加成功',
        })
        onOpenChange(false)
        onSuccess()
        resetForm()
      } else {
        toast({
          title: '错误',
          description: result.error?.message || '添加主页失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '添加主页失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加 Facebook 主页</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="userAccessToken">使用用户访问口令获取主页</Label>
            <div className="flex gap-2">
              <Input
                id="userAccessToken"
                type="password"
                placeholder="粘贴 Graph API Explorer 生成的用户访问口令"
                value={userAccessToken}
                onChange={(e) => setUserAccessToken(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleExchangeUserToken}
                disabled={exchangingToken}
              >
                {exchangingToken ? '转换中...' : '转长期口令'}
              </Button>
              <Button type="button" variant="outline" onClick={handleDiscoverPages} disabled={discovering}>
                {discovering ? '获取中...' : '获取主页'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              先将短期用户口令转换为长期口令，再获取主页，可拿到更稳定的主页访问令牌。
            </p>
            {discoveredPages.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    已选择 {selectedPageIds.length}/{discoveredPages.length} 个主页
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPageIds(discoveredPages.map(page => page.pageId))}
                    >
                      全选
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPageIds([])}
                    >
                      清空
                    </Button>
                  </div>
                </div>
                {discoveredPages.map(page => (
                  <div
                    key={page.pageId}
                    className="flex gap-3 rounded-md border p-3 hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedPageIds.includes(page.pageId)}
                      onCheckedChange={(checked) => toggleSelectedPage(page.pageId, checked)}
                      className="mt-1"
                    />
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() => handleSelectDiscoveredPage(page)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{page.pageName}</span>
                        {existingPageIds.has(page.pageId) && (
                          <Badge variant="outline">已存在，将更新Token</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">ID: {page.pageId}</div>
                      {page.tasks.length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          权限任务：{page.tasks.join(', ')}
                        </div>
                      )}
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleBatchSubmit}
                  disabled={batchLoading || selectedPageIds.length === 0}
                >
                  {batchLoading ? '处理中...' : `批量添加/更新 ${selectedPageIds.length} 个主页`}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pageId">主页 ID</Label>
            <Input
              id="pageId"
              placeholder="输入 Facebook 主页 ID"
              value={formData.pageId}
              onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pageName">主页名称</Label>
            <Input
              id="pageName"
              placeholder="输入主页名称"
              value={formData.pageName}
              onChange={(e) => setFormData({ ...formData, pageName: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accessToken">访问令牌</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="输入主页访问令牌"
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="niche">内容类型</Label>
              <Input
                id="niche"
                placeholder="如：婿情"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">地区</Label>
              <Input
                id="region"
                placeholder="如：CN"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">语言</Label>
              <Input
                id="language"
                placeholder="en"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dailyPostLimit">每日上限</Label>
              <Input
                id="dailyPostLimit"
                type="number"
                min="1"
                max="50"
                value={formData.dailyPostLimit}
                onChange={(e) => setFormData({ ...formData, dailyPostLimit: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '正在添加...' : '添加主页'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditPageDialogProps {
  page: FacebookPage | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function EditPageDialog({ page, open, onOpenChange, onSuccess }: EditPageDialogProps) {
  const [formData, setFormData] = useState({
    pageName: '',
    accessToken: '',
    niche: '',
    region: '',
    language: 'en',
    timezone: 'America/New_York',
    dailyPostLimit: 10,
    status: 'ACTIVE',
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!page) return
    setFormData({
      pageName: page.pageName,
      accessToken: page.accessToken || '',
      niche: page.niche || '',
      region: page.region || '',
      language: page.language || 'en',
      timezone: page.timezone || 'America/New_York',
      dailyPostLimit: page.dailyPostLimit,
      status: page.status,
    })
  }, [page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!page) return

    try {
      setLoading(true)
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: '成功', description: '主页已更新' })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: '错误',
          description: result.error?.message || '更新主页失败',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: '错误',
        description: '更新主页失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑 Facebook 主页</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>主页 ID</Label>
            <Input value={page?.pageId || ''} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editPageName">主页名称</Label>
            <Input
              id="editPageName"
              value={formData.pageName}
              onChange={(e) => setFormData({ ...formData, pageName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editAccessToken">Page Access Token</Label>
            <Input
              id="editAccessToken"
              type="password"
              placeholder="替换为新的主页访问令牌"
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editNiche">内容类型</Label>
              <Input
                id="editNiche"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRegion">地区</Label>
              <Input
                id="editRegion"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editLanguage">语言</Label>
              <Input
                id="editLanguage"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDailyPostLimit">每日上限</Label>
              <Input
                id="editDailyPostLimit"
                type="number"
                min="1"
                max="50"
                value={formData.dailyPostLimit}
                onChange={(e) => setFormData({ ...formData, dailyPostLimit: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>状态</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">正常</SelectItem>
                <SelectItem value="PAUSED">暂停</SelectItem>
                <SelectItem value="WARNING">预警</SelectItem>
                <SelectItem value="RESTRICTED">受限</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '保存中...' : '保存修改'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

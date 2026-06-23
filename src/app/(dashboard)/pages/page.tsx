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
import { formatNumber, getStatusColor, getHealthScoreColor } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { Facebook, Plus, Search, MoreHorizontal, RefreshCw } from 'lucide-react'

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
        title: 'Error',
        description: 'Failed to fetch pages',
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
        toast({ title: 'Success', description: 'Page paused successfully' })
        fetchPages()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to pause page',
        variant: 'destructive',
      })
    }
  }
  
  const handleResumePage = async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}/resume`, { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        toast({ title: 'Success', description: 'Page resumed successfully' })
        fetchPages()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resume page',
        variant: 'destructive',
      })
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facebook Pages</h1>
          <p className="text-muted-foreground">
            Manage your Facebook pages for publishing
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Page
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="WARNING">Warning</SelectItem>
            <SelectItem value="RESTRICTED">Restricted</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchPages}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Pages List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading pages...</div>
        </div>
      ) : filteredPages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Facebook className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No pages found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Add your first Facebook page to get started'}
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
                    <p className="text-muted-foreground">Fans</p>
                    <p className="font-medium">{formatNumber(page.fansCount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Health</p>
                    <p className={`font-medium ${getHealthScoreColor(page.healthScore)}`}>
                      {page.healthScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Today</p>
                    <p className="font-medium">
                      {page.todayPostCount}/{page.dailyPostLimit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Language</p>
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
                <div className="flex gap-2">
                  {page.status === 'ACTIVE' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePausePage(page.id)}
                    >
                      Pause
                    </Button>
                  ) : page.status === 'PAUSED' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleResumePage(page.id)}
                    >
                      Resume
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm">
                    Details
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
        onSuccess={fetchPages}
      />
    </div>
  )
}

interface AddPageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function AddPageDialog({ open, onOpenChange, onSuccess }: AddPageDialogProps) {
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
  const { toast } = useToast()
  
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
        toast({ title: 'Success', description: 'Page added successfully' })
        onOpenChange(false)
        onSuccess()
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
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to add page',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add page',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Facebook Page</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pageId">Page ID</Label>
            <Input
              id="pageId"
              placeholder="Enter Facebook Page ID"
              value={formData.pageId}
              onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pageName">Page Name</Label>
            <Input
              id="pageName"
              placeholder="Enter page name"
              value={formData.pageName}
              onChange={(e) => setFormData({ ...formData, pageName: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="Enter page access token"
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Niche</Label>
              <Input
                id="niche"
                placeholder="e.g., Romance"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                placeholder="e.g., US"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                placeholder="en"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dailyPostLimit">Daily Limit</Label>
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
            {loading ? 'Adding...' : 'Add Page'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
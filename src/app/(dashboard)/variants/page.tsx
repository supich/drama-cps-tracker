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
import { Layers, Plus, Search, Play, Tag, Video } from 'lucide-react'

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

export default function VariantsPage() {
  const [variants, setVariants] = useState<VariantData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchVariants()
  }, [])

  const fetchVariants = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/variants')
      const result = await response.json()

      if (result.success) {
        setVariants(result.data.variants)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch variants',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold">Video Variants</h1>
          <p className="text-muted-foreground">
            Manage different versions of your videos
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Variant
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search variants..."
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
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Variants List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading variants...</div>
        </div>
      ) : filteredVariants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No variants found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first variant to get started'}
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
                    <p className="text-muted-foreground">Tasks</p>
                    <p className="font-medium">{variant._count.publishTasks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Drama</p>
                    <p className="font-medium text-xs line-clamp-1">
                      {variant.video.drama.dramaName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Video className="h-3 w-3" />
                  {formatDate(variant.createdAt)}
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
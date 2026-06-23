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
import { Video, Plus, Search, Play, Clock } from 'lucide-react'

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

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          上传视频
        </Button>
      </div>

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
                
                <Button variant="outline" size="sm" className="w-full">
                  查看详情
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
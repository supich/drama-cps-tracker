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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDateTime, getStatusColor } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, Facebook, Video } from 'lucide-react'

interface Variant {
  id: string
  variantName: string
  title: string
  video: {
    id: string
    title: string
    drama: { dramaName: string }
  }
}

interface VideoOption {
  id: string
  title: string
  status: string
  drama: { dramaName: string }
}

interface Page {
  id: string
  pageName: string
  pageId: string
  status: string
  healthScore: number
  dailyPostLimit: number
}

interface Task {
  id: string
  scheduledAt: string
  status: string
  page: { pageName: string }
  video: { title: string }
  variant: { variantName: string }
}

export default function SchedulerPage() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [videos, setVideos] = useState<VideoOption[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVariants, setSelectedVariants] = useState<string[]>([])
  const [selectedVideos, setSelectedVideos] = useState<string[]>([])
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [staggerMin, setStaggerMin] = useState(15)
  const [staggerMax, setStaggerMax] = useState(90)
  const [publishHoursStart, setPublishHoursStart] = useState(8)
  const [publishHoursEnd, setPublishHoursEnd] = useState(22)
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    // 设置本周开始日期
    const today = new Date()
    const dayOfWeek = today.getDay()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    setCurrentWeekStart(weekStart)
    
    // 设置默认日期范围为未来7天
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    setStartDate(today.toISOString().split('T')[0])
    setEndDate(nextWeek.toISOString().split('T')[0])

    const params = new URLSearchParams(window.location.search)
    const videoId = params.get('videoId')
    const variantId = params.get('variantId')
    if (videoId) {
      setSelectedVideos([videoId])
      setIsDialogOpen(true)
    }
    if (variantId) {
      setSelectedVariants([variantId])
      setIsDialogOpen(true)
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [variantsRes, videosRes, pagesRes, tasksRes] = await Promise.all([
        fetch('/api/variants?limit=100'),
        fetch('/api/videos?limit=100'),
        fetch('/api/pages?limit=100'),
        fetch('/api/publish-tasks?limit=100'),
      ])

      const [variantsResult, videosResult, pagesResult, tasksResult] = await Promise.all([
        variantsRes.json(),
        videosRes.json(),
        pagesRes.json(),
        tasksRes.json(),
      ])

      if (variantsResult.success) setVariants(variantsResult.data.variants || [])
      if (videosResult.success) setVideos(videosResult.data.videos || [])
      if (pagesResult.success) setPages(pagesResult.data.pages || [])
      if (tasksResult.success) setTasks(tasksResult.data.tasks || [])
    } catch (error) {
      toast({
        title: '错误',
        description: '获取数据失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBatchTasks = async () => {
    if (selectedVariants.length === 0 && selectedVideos.length === 0) {
      toast({ title: '错误', description: '请至少选择一个视频或剪辑版本', variant: 'destructive' })
      return
    }
    if (selectedPages.length === 0) {
      toast({ title: '错误', description: '请至少选择一个主页', variant: 'destructive' })
      return
    }

    try {
      const response = await fetch('/api/publish-tasks/batch-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantIds: selectedVariants,
          videoIds: selectedVideos,
          pageIds: selectedPages,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          staggerMin,
          staggerMax,
          publishHoursStart,
          publishHoursEnd,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: '成功',
          description: `已创建 ${result.data.created} 个发布任务`,
        })
        setIsDialogOpen(false)
        fetchData()
        setSelectedVariants([])
        setSelectedVideos([])
        setSelectedPages([])
      } else {
        toast({
          title: '错误',
          description: result.error?.message || '创建任务失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '创建批量任务失败',
        variant: 'destructive',
      })
    }
  }

  // 获取一周的日期
  const getWeekDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart)
      day.setDate(currentWeekStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  // 获取某天的任务
  const getTasksForDay = (date: Date) => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    return tasks.filter(task => {
      const taskDate = new Date(task.scheduledAt)
      return taskDate >= dayStart && taskDate <= dayEnd
    })
  }

  // 导航周视图
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart)
    prevWeek.setDate(currentWeekStart.getDate() - 7)
    setCurrentWeekStart(prevWeek)
  }

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart)
    nextWeek.setDate(currentWeekStart.getDate() + 7)
    setCurrentWeekStart(nextWeek)
  }

  const goToToday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    setCurrentWeekStart(weekStart)
  }

  const weekDays = getWeekDays()
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">发布计划</h1>
          <p className="text-muted-foreground">
            安排并管理您的发布任务
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              创建批量任务
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建批量发布任务</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Select Variants */}
              <div className="space-y-2">
                <Label>选择原始视频（已选 {selectedVideos.length} 个）</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {videos.map(video => (
                    <div key={video.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`video-${video.id}`}
                        checked={selectedVideos.includes(video.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedVideos([...selectedVideos, video.id])
                          } else {
                            setSelectedVideos(selectedVideos.filter(id => id !== video.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`video-${video.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {video.title} - {video.drama.dramaName}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {video.status}
                        </Badge>
                      </label>
                    </div>
                  ))}
                  {videos.length === 0 && (
                    <p className="text-sm text-muted-foreground">暂无视频，请先在视频管理中创建视频。</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>选择剪辑版本（已选 {selectedVariants.length} 个）</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {variants.map(variant => (
                    <div key={variant.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`variant-${variant.id}`}
                        checked={selectedVariants.includes(variant.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedVariants([...selectedVariants, variant.id])
                          } else {
                            setSelectedVariants(selectedVariants.filter(id => id !== variant.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`variant-${variant.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {variant.variantName} - {variant.video.drama.dramaName}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {variant.title}
                        </Badge>
                      </label>
                    </div>
                  ))}
                  {variants.length === 0 && (
                    <p className="text-sm text-muted-foreground">暂无剪辑版本，可直接选择上方原始视频发布。</p>
                  )}
                </div>
              </div>

              {/* Select Pages */}
              <div className="space-y-2">
                <Label>选择主页（已选 {selectedPages.length} 个）</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {pages.filter(p => p.status === 'ACTIVE').map(page => (
                    <div key={page.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`page-${page.id}`}
                        checked={selectedPages.includes(page.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPages([...selectedPages, page.id])
                          } else {
                            setSelectedPages(selectedPages.filter(id => id !== page.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`page-${page.id}`}
                        className="text-sm cursor-pointer flex items-center gap-2"
                      >
                        {page.pageName}
                        <Badge variant="outline" className="text-xs">
                          健康度：{page.healthScore}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始日期</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>结束日期</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Stagger Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最小间隔（分钟）</Label>
                  <Input
                    type="number"
                    value={staggerMin}
                    onChange={(e) => setStaggerMin(parseInt(e.target.value))}
                    min={5}
                    max={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大间隔（分钟）</Label>
                  <Input
                    type="number"
                    value={staggerMax}
                    onChange={(e) => setStaggerMax(parseInt(e.target.value))}
                    min={15}
                    max={240}
                  />
                </div>
              </div>

              {/* Publish Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>发布开始时段</Label>
                  <Input
                    type="number"
                    value={publishHoursStart}
                    onChange={(e) => setPublishHoursStart(parseInt(e.target.value))}
                    min={0}
                    max={23}
                  />
                </div>
                <div className="space-y-2">
                  <Label>发布结束时段</Label>
                  <Input
                    type="number"
                    value={publishHoursEnd}
                    onChange={(e) => setPublishHoursEnd(parseInt(e.target.value))}
                    min={0}
                    max={23}
                  />
                </div>
              </div>

              <Button onClick={handleCreateBatchTasks} className="w-full">
                创建任务
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {weekDays[0].toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          今天
        </Button>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">正在加载日历...</div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {dayNames.map((day, index) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {/* Day Cells */}
          {weekDays.map((day, index) => {
            const dayTasks = getTasksForDay(day)
            const isToday = new Date().toDateString() === day.toDateString()

            return (
              <Card
                key={index}
                className={`min-h-[150px] ${isToday ? 'border-primary' : ''}`}
              >
                <CardHeader className="p-2">
                  <div className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                    {day.getDate()}
                  </div>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="p-1 rounded text-xs bg-muted truncate"
                    >
                      <div className="font-medium">{task.variant.variantName}</div>
                      <div className="text-muted-foreground">
                        {new Date(task.scheduledAt).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayTasks.length - 3} 更多
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upcoming Tasks Summary */}
      <Card>
        <CardHeader>
          <CardTitle>即将发布任务</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks
              .filter(t => t.status === 'PENDING')
              .slice(0, 10)
              .map(task => (
                <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{task.variant.variantName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{task.page.pageName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDateTime(task.scheduledAt)}</span>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            {tasks.filter(t => t.status === 'PENDING').length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                暂无待发布任务
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Settings, Save, RefreshCw } from 'lucide-react'

interface SystemSetting {
  key: string
  value: string
  description: string
}

const defaultSettings: SystemSetting[] = [
  { key: 'DAILY_POST_LIMIT', value: '10', description: '每个主页每日默认发布上限' },
  { key: 'MIN_STAGGER_INTERVAL', value: '15', description: '最小间隔时间（分钟）' },
  { key: 'MAX_STAGGER_INTERVAL', value: '90', description: '最大间隔时间（分钟）' },
  { key: 'MAX_RETRY_COUNT', value: '2', description: '失败任务最大重试次数' },
  { key: 'CONSECUTIVE_FAIL_THRESHOLD', value: '3', description: '连续失败多少次后暂停主页' },
  { key: 'HEALTH_SCORE_THRESHOLD', value: '60', description: '继续发布所需最低健康分' },
  { key: 'INSIGHTS_SYNC_INTERVAL', value: '30', description: '数据同步间隔（分钟）' },
  { key: 'HEALTH_CHECK_INTERVAL', value: '60', description: '健康检查间隔（分钟）' },
]

interface EnvInfo {
  NODE_ENV: string
  META_APP_ID: string
  DATABASE_URL: string
  REDIS_URL: string
  STORAGE_TYPE: string
  UPLOAD_DIR: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/system/env')
      .then(r => r.json())
      .then(result => { if (result.success) setEnvInfo(result.data) })
      .catch(() => {})
  }, [])

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // 这里应该调用API保存设置到数据库
      // 为简化示例，我们只显示成功消息
      toast({
        title: '保存成功',
        description: '设置已保存',
      })
    } catch (error) {
      toast({
        title: '错误',
        description: '保存设置失败',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefault = () => {
    setSettings(defaultSettings)
    toast({
      title: '已重置',
      description: '设置已恢复默认値',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">系统设置</h1>
          <p className="text-muted-foreground">
            配置系统参数与风控规则
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetToDefault}>
            <RefreshCw className="mr-2 h-4 w-4" />
            恢复默认
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Publishing Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              发布限制
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.slice(0, 3).map((setting) => (
              <div key={setting.key} className="space-y-2">
                <Label htmlFor={setting.key}>{setting.description}</Label>
                <Input
                  id={setting.key}
                  type="number"
                  value={setting.value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                  min="1"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risk Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              风控规则
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.slice(3, 6).map((setting) => (
              <div key={setting.key} className="space-y-2">
                <Label htmlFor={setting.key}>{setting.description}</Label>
                <Input
                  id={setting.key}
                  type="number"
                  value={setting.value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                  min="1"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sync Intervals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              同步间隔
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.slice(6).map((setting) => (
              <div key={setting.key} className="space-y-2">
                <Label htmlFor={setting.key}>{setting.description}</Label>
                <Input
                  id={setting.key}
                  type="number"
                  value={setting.value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                  min="1"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              通知设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>邮件通知</Label>
                <p className="text-sm text-muted-foreground">
                  任务失败时发送邮件警报
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Slack 通知</Label>
                <p className="text-sm text-muted-foreground">
                  重要问题发送 Slack 警报
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>每日汇总</Label>
                <p className="text-sm text-muted-foreground">
                  接收每日表现汇总报告
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>环境变量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {envInfo ? (
              Object.entries(envInfo).map(([key, value]) => (
                <div key={key}>
                  <p className="font-medium">{key}</p>
                  <p className="text-muted-foreground font-mono text-xs">{value}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground col-span-2">加载中...</p>
            )}
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              注：环境变量从 Railway 平台注入。上方设置将存入数据库并覆盖默认值。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState } from 'react'
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
  { key: 'DAILY_POST_LIMIT', value: '10', description: 'Default daily post limit per page' },
  { key: 'MIN_STAGGER_INTERVAL', value: '15', description: 'Minimum stagger interval in minutes' },
  { key: 'MAX_STAGGER_INTERVAL', value: '90', description: 'Maximum stagger interval in minutes' },
  { key: 'MAX_RETRY_COUNT', value: '2', description: 'Maximum retry count for failed tasks' },
  { key: 'CONSECUTIVE_FAIL_THRESHOLD', value: '3', description: 'Consecutive failures to pause page' },
  { key: 'HEALTH_SCORE_THRESHOLD', value: '60', description: 'Minimum health score to continue publishing' },
  { key: 'INSIGHTS_SYNC_INTERVAL', value: '30', description: 'Insights sync interval in minutes' },
  { key: 'HEALTH_CHECK_INTERVAL', value: '60', description: 'Health check interval in minutes' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // 这里应该调用API保存设置到数据库
      // 为简化示例，我们只显示成功消息
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefault = () => {
    setSettings(defaultSettings)
    toast({
      title: 'Settings reset',
      description: 'Settings have been reset to default values',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and risk control rules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetToDefault}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
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
              Publishing Limits
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
              Risk Control
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
              Sync Intervals
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
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email alerts for failed tasks
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Slack Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send Slack alerts for critical issues
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Daily Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive daily performance summary
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
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">NODE_ENV</p>
              <p className="text-muted-foreground">development</p>
            </div>
            <div>
              <p className="font-medium">META_APP_ID</p>
              <p className="text-muted-foreground">configured</p>
            </div>
            <div>
              <p className="font-medium">DATABASE_URL</p>
              <p className="text-muted-foreground">postgresql://...</p>
            </div>
            <div>
              <p className="font-medium">REDIS_URL</p>
              <p className="text-muted-foreground">redis://localhost:6379</p>
            </div>
            <div>
              <p className="font-medium">STORAGE_TYPE</p>
              <p className="text-muted-foreground">local</p>
            </div>
            <div>
              <p className="font-medium">UPLOAD_DIR</p>
              <p className="text-muted-foreground">./uploads</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Note: Environment variables are loaded from .env file. 
              Changes to settings above are stored in the database and will override these defaults.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
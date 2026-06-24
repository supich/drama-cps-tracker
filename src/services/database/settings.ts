import prisma from '@/lib/prisma'
import { RISK_RULES } from '@/lib/constants'

export interface SystemSettingDefinition {
  key: string
  value: string
  description: string
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingDefinition[] = [
  { key: 'DAILY_POST_LIMIT', value: String(RISK_RULES.DEFAULT_DAILY_POST_LIMIT), description: '每个主页每日默认发布上限' },
  { key: 'MIN_STAGGER_INTERVAL', value: String(RISK_RULES.MIN_STAGGER_INTERVAL), description: '最小间隔时间（分钟）' },
  { key: 'MAX_STAGGER_INTERVAL', value: String(RISK_RULES.MAX_STAGGER_INTERVAL), description: '最大间隔时间（分钟）' },
  { key: 'MAX_RETRY_COUNT', value: String(RISK_RULES.MAX_RETRY_COUNT), description: '失败任务最大重试次数' },
  { key: 'CONSECUTIVE_FAIL_THRESHOLD', value: String(RISK_RULES.CONSECUTIVE_FAIL_THRESHOLD), description: '连续失败多少次后暂停主页' },
  { key: 'HEALTH_SCORE_THRESHOLD', value: String(RISK_RULES.HEALTH_SCORE_THRESHOLD), description: '继续发布所需最低健康分' },
  { key: 'INSIGHTS_SYNC_INTERVAL', value: '30', description: '数据同步间隔（分钟）' },
  { key: 'HEALTH_CHECK_INTERVAL', value: '60', description: '健康检查间隔（分钟）' },
  { key: 'META_APP_ID', value: process.env.META_APP_ID || '', description: 'Meta App ID' },
  { key: 'META_APP_SECRET', value: process.env.META_APP_SECRET || '', description: 'Meta App Secret' },
]

const DEFAULT_SETTING_MAP = new Map(DEFAULT_SYSTEM_SETTINGS.map(setting => [setting.key, setting]))

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export class SettingsService {
  async getSettings() {
    const savedSettings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    })
    const savedByKey = new Map(savedSettings.map(setting => [setting.key, setting]))

    return DEFAULT_SYSTEM_SETTINGS.map(defaultSetting => {
      const saved = savedByKey.get(defaultSetting.key)
      return {
        key: defaultSetting.key,
        value: saved?.value ?? defaultSetting.value,
        description: saved?.description ?? defaultSetting.description,
      }
    })
  }

  async updateSettings(settings: Array<{ key: string; value: string }>) {
    const validSettings = settings.filter(setting => DEFAULT_SETTING_MAP.has(setting.key))

    await prisma.$transaction(
      validSettings.map(setting => {
        const definition = DEFAULT_SETTING_MAP.get(setting.key)!
        return prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            description: definition.description,
          },
          create: {
            key: setting.key,
            value: setting.value,
            description: definition.description,
          },
        })
      })
    )

    return this.getSettings()
  }

  async resetSettings() {
    return this.updateSettings(DEFAULT_SYSTEM_SETTINGS.map(({ key, value }) => ({ key, value })))
  }

  async getRiskRules() {
    const settings = await this.getSettings()
    const values = new Map(settings.map(setting => [setting.key, setting.value]))

    return {
      DEFAULT_DAILY_POST_LIMIT: parsePositiveInt(values.get('DAILY_POST_LIMIT'), RISK_RULES.DEFAULT_DAILY_POST_LIMIT),
      MIN_STAGGER_INTERVAL: parsePositiveInt(values.get('MIN_STAGGER_INTERVAL'), RISK_RULES.MIN_STAGGER_INTERVAL),
      MAX_STAGGER_INTERVAL: parsePositiveInt(values.get('MAX_STAGGER_INTERVAL'), RISK_RULES.MAX_STAGGER_INTERVAL),
      MAX_RETRY_COUNT: parsePositiveInt(values.get('MAX_RETRY_COUNT'), RISK_RULES.MAX_RETRY_COUNT),
      CONSECUTIVE_FAIL_THRESHOLD: parsePositiveInt(values.get('CONSECUTIVE_FAIL_THRESHOLD'), RISK_RULES.CONSECUTIVE_FAIL_THRESHOLD),
      HEALTH_SCORE_THRESHOLD: parsePositiveInt(values.get('HEALTH_SCORE_THRESHOLD'), RISK_RULES.HEALTH_SCORE_THRESHOLD),
      HEALTH_SCORE: RISK_RULES.HEALTH_SCORE,
    }
  }

  async getMetaAppCredentials() {
    const settings = await this.getSettings()
    const values = new Map(settings.map(setting => [setting.key, setting.value]))

    return {
      appId: values.get('META_APP_ID') || process.env.META_APP_ID || '',
      appSecret: values.get('META_APP_SECRET') || process.env.META_APP_SECRET || '',
    }
  }
}

export const settingsService = new SettingsService()

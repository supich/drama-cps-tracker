import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化数字
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化货币
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

// 格式化日期
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// 格式化日期时间
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 生成随机间隔（分钟）
export function getRandomInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 生成追踪链接
export function generateTrackingUrl(
  baseUrl: string,
  params: {
    dramaId?: string
    pageId?: string
    videoId?: string
    variantId?: string
  }
): string {
  const url = new URL('/go', baseUrl)
  if (params.dramaId) url.searchParams.set('drama_id', params.dramaId)
  if (params.pageId) url.searchParams.set('page_id', params.pageId)
  if (params.videoId) url.searchParams.set('video_id', params.videoId)
  if (params.variantId) url.searchParams.set('variant_id', params.variantId)
  return url.toString()
}

// 验证 Facebook Page ID 格式
export function isValidPageId(pageId: string): boolean {
  return /^\d{15,20}$/.test(pageId)
}

// 健康分颜色
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

// 状态颜色映射
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    WARNING: 'bg-orange-100 text-orange-800',
    RESTRICTED: 'bg-red-100 text-red-800',
    BANNED: 'bg-gray-100 text-gray-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    READY: 'bg-blue-100 text-blue-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELED: 'bg-gray-100 text-gray-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}
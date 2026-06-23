// 风控规则常量
export const RISK_RULES = {
  // 默认每日发布上限
  DEFAULT_DAILY_POST_LIMIT: parseInt(process.env.DEFAULT_DAILY_POST_LIMIT || '10'),
  
  // 发布错峰间隔（分钟）
  MIN_STAGGER_INTERVAL: parseInt(process.env.MIN_STAGGER_INTERVAL || '15'),
  MAX_STAGGER_INTERVAL: parseInt(process.env.MAX_STAGGER_INTERVAL || '90'),
  
  // 最大重试次数
  MAX_RETRY_COUNT: parseInt(process.env.MAX_RETRY_COUNT || '2'),
  
  // 连续失败暂停阈值
  CONSECUTIVE_FAIL_THRESHOLD: parseInt(process.env.CONSECUTIVE_FAIL_THRESHOLD || '3'),
  
  // 健康分阈值
  HEALTH_SCORE_THRESHOLD: parseInt(process.env.HEALTH_SCORE_THRESHOLD || '60'),
  
  // 健康分变动
  HEALTH_SCORE: {
    PUBLISH_SUCCESS: 1,
    PUBLISH_FAIL: -5,
    CONSECUTIVE_FAIL: -10,
    WARNING: -20,
    RESTRICTED: -50,
    RECOVERY: 5, // 每日恢复
  },
} as const

// Meta API 常量
export const META_API = {
  VERSION: process.env.META_API_VERSION || 'v19.0',
  BASE_URL: 'https://graph.facebook.com',
  REQUIRED_PERMISSIONS: [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_read_user_content',
    'pages_show_list',
  ],
} as const

// 主页状态
export const PAGE_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  WARNING: 'WARNING',
  RESTRICTED: 'RESTRICTED',
  BANNED: 'BANNED',
} as const

// 任务状态
export const TASK_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
} as const

// 视频状态
export const VIDEO_STATUS = {
  DRAFT: 'DRAFT',
  READY: 'READY',
  ARCHIVED: 'ARCHIVED',
  BANNED: 'BANNED',
} as const

// 变体状态
export const VARIANT_STATUS = {
  DRAFT: 'DRAFT',
  READY: 'READY',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const

// Hook 类型
export const HOOK_TYPES = [
  { value: 'suspense', label: 'Suspense' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'conflict', label: 'Conflict' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'romance', label: 'Romance' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'drama', label: 'Drama' },
] as const

// CTA 类型
export const CTA_TYPES = [
  { value: 'watch_now', label: 'Watch Now' },
  { value: 'free_episode', label: 'Free Episode' },
  { value: 'continue_watching', label: 'Continue Watching' },
  { value: 'see_what_happens', label: 'See What Happens' },
  { value: 'full_series', label: 'Full Series' },
  { value: 'exclusive_content', label: 'Exclusive Content' },
] as const

// 赛道标签
export const NICHE_OPTIONS = [
  { value: 'romance', label: 'Romance / 情感' },
  { value: 'revenge', label: 'Revenge / 逆袭' },
  { value: 'sweet', label: 'Sweet Love / 甜宠' },
  { value: 'suspense', label: 'Suspense / 悬疑' },
  { value: 'urban', label: 'Urban / 都市' },
  { value: 'fantasy', label: 'Fantasy / 奇幻' },
  { value: 'family', label: 'Family / 家庭' },
] as const

// 地区选项
export const REGION_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'SEA', label: 'Southeast Asia' },
  { value: 'LATAM', label: 'Latin America' },
  { value: 'EU', label: 'Europe' },
  { value: 'MENA', label: 'Middle East & North Africa' },
  { value: 'KR', label: 'Korea' },
  { value: 'JP', label: 'Japan' },
  { value: 'BR', label: 'Brazil' },
] as const

// 语言选项
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' },
  { value: 'th', label: 'Thai' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'id', label: 'Indonesian' },
  { value: 'ar', label: 'Arabic' },
] as const

// 时区选项（常用）
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Mexico_City', label: 'Mexico City' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Bangkok', label: 'Bangkok' },
  { value: 'Asia/Jakarta', label: 'Jakarta' },
  { value: 'Asia/Dubai', label: 'Dubai' },
] as const
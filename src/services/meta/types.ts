// Meta API 类型定义
export interface MetaPageInfo {
  id: string
  name: string
  category: string
  fan_count: number
  cover?: {
    source: string
  }
  picture?: {
    data: {
      url: string
    }
  }
}

export interface MetaTokenInfo {
  app_id: string
  type: string
  application: string
  data_access_expires_at: number
  expires_at: number
  is_valid: boolean
  scopes: string[]
  user_id: string
}

export interface MetaUserPageAccount {
  id: string
  name: string
  access_token: string
  category?: string
  tasks?: string[]
}

export interface MetaLongLivedTokenResponse {
  access_token: string
  token_type?: string
  expires_in?: number
}

export interface MetaPostInsights {
  data: Array<{
    name: string
    period: string
    values: Array<{
      value: number | Record<string, number>
    }>
    title: string
    description: string
  }>
}

export type MetaVideoInsights = MetaPostInsights

export interface MetaObjectEngagement {
  comments?: {
    summary?: {
      total_count?: number
    }
  }
  reactions?: {
    summary?: {
      total_count?: number
    }
  }
  likes?: {
    summary?: {
      total_count?: number
    }
  }
  shares?: {
    count?: number
  }
}

export interface MetaPostVideoReference {
  object_id?: string
  attachments?: {
    data?: Array<{
      media_type?: string
      type?: string
      target?: {
        id?: string
      }
    }>
  }
}

export interface MetaPublishVideoResponse {
  id: string
  post_id: string
}

export interface MetaAPIResponse<T> {
  data?: T
  error?: {
    message: string
    type: string
    code: number
    error_subcode?: number
    fbtrace_id: string
  }
}

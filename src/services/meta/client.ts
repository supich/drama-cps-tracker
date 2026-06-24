import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { META_API } from '@/lib/constants'
import { MetaAPIError } from '@/lib/errors'
import {
  MetaPageInfo,
  MetaTokenInfo,
  MetaUserPageAccount,
  MetaPostInsights,
  MetaPublishVideoResponse,
  MetaAPIResponse,
} from './types'

export class MetaClient {
  private client: AxiosInstance
  private apiVersion: string

  constructor() {
    this.apiVersion = META_API.VERSION
    this.client = axios.create({
      baseURL: `${META_API.BASE_URL}/${this.apiVersion}`,
      timeout: 30000,
    })
  }

  // 验证 Page Access Token
  async validatePageToken(accessToken: string): Promise<MetaTokenInfo> {
    try {
      if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
        throw new MetaAPIError('缺少 META_APP_ID 或 META_APP_SECRET，无法验证 Facebook Token')
      }

      const response: AxiosResponse<MetaAPIResponse<MetaTokenInfo>> = await this.client.get(
        '/debug_token',
        {
          params: {
            input_token: accessToken,
            access_token: `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`,
          },
        }
      )

      if (response.data.error) {
        throw new MetaAPIError(
          response.data.error.message,
          response.data.error
        )
      }

      if (!response.data.data) {
        throw new MetaAPIError('No token data returned')
      }

      return response.data.data
    } catch (error: any) {
      if (error instanceof MetaAPIError) throw error
      throw new MetaAPIError(
        `Failed to validate token: ${error.message}`,
        error.response?.data?.error
      )
    }
  }

  // 使用 User Access Token 获取可管理主页及对应 Page Access Token
  async getUserPages(userAccessToken: string): Promise<MetaUserPageAccount[]> {
    try {
      const response: AxiosResponse<MetaAPIResponse<MetaUserPageAccount[]>> =
        await this.client.get('/me/accounts', {
          params: {
            fields: 'id,name,access_token,category,tasks',
            access_token: userAccessToken,
          },
        })

      if (response.data.error) {
        throw new MetaAPIError(response.data.error.message, response.data.error)
      }

      return response.data.data || []
    } catch (error: any) {
      if (error instanceof MetaAPIError) throw error
      const metaError = error.response?.data?.error
      if (metaError) {
        throw new MetaAPIError(
          `获取主页列表失败：${metaError.message}`,
          metaError,
          error.response?.status || 400
        )
      }
      throw new MetaAPIError(`获取主页列表失败：${error.message}`)
    }
  }

  // 获取 Page 信息
  async getPageInfo(
    pageId: string,
    accessToken: string
  ): Promise<MetaPageInfo> {
    try {
      const response: AxiosResponse<MetaAPIResponse<MetaPageInfo>> =
        await this.client.get(`/${pageId}`, {
          params: {
            fields: 'id,name,category,fan_count,cover,picture',
            access_token: accessToken,
          },
        })

      if (response.data.error) {
        throw new MetaAPIError(
          response.data.error.message,
          response.data.error
        )
      }

      if (!response.data.data) {
        throw new MetaAPIError('No page data returned')
      }

      return response.data.data
    } catch (error: any) {
      if (error instanceof MetaAPIError) throw error
      throw new MetaAPIError(
        `Failed to get page info: ${error.message}`,
        error.response?.data?.error
      )
    }
  }

  // 发布视频到 Page
  async publishVideoToPage(
    pageId: string,
    accessToken: string,
    videoUrl: string,
    title: string,
    description: string
  ): Promise<MetaPublishVideoResponse> {
    try {
      const form = new URLSearchParams()
      form.set('access_token', accessToken)
      form.set('file_url', videoUrl)
      form.set('title', title)
      form.set('description', description)
      form.set('published', 'true')

      const response: AxiosResponse<
        MetaAPIResponse<MetaPublishVideoResponse> | MetaPublishVideoResponse
      > = await this.client.post(`/${pageId}/videos`, form, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const responseData = response.data
      const metaError = 'error' in responseData ? responseData.error : undefined

      if (metaError) {
        throw new MetaAPIError(
          metaError.message,
          metaError
        )
      }

      const publishData = 'data' in responseData && responseData.data
        ? responseData.data
        : responseData as MetaPublishVideoResponse

      if (!publishData?.id) {
        throw new MetaAPIError('No publish response data')
      }

      return {
        id: publishData.id,
        post_id: publishData.post_id || publishData.id,
      }
    } catch (error: any) {
      if (error instanceof MetaAPIError) throw error
      const metaError = error.response?.data?.error
      if (metaError) {
        const permissionHint = metaError.code === 100 && /permission/i.test(metaError.message || '')
          ? '请确认该主页保存的是 Page Access Token，不是 User Token；Token 需要具备发布视频/主页发帖权限，并且授权用户需要拥有该主页的完整管理权限。'
          : null
        const details = [
          metaError.message,
          permissionHint,
          metaError.type ? `type: ${metaError.type}` : null,
          metaError.code ? `code: ${metaError.code}` : null,
          metaError.error_subcode ? `subcode: ${metaError.error_subcode}` : null,
          metaError.fbtrace_id ? `trace: ${metaError.fbtrace_id}` : null,
        ].filter(Boolean).join(' | ')

        throw new MetaAPIError(
          `Facebook 发布失败：${details}`,
          metaError,
          error.response?.status || 400
        )
      }

      throw new MetaAPIError(
        `Failed to publish video: ${error.message}`,
        error.response?.data,
        error.response?.status || 400
      )
    }
  }

  // 获取帖子 Insights
  async getPostInsights(
    postId: string,
    accessToken: string
  ): Promise<MetaPostInsights> {
    try {
      const metrics = [
        'post_impressions',
        'post_reactions_by_type_total',
        'post_clicks',
        'post_video_views',
      ].join(',')

      const response: AxiosResponse<MetaAPIResponse<MetaPostInsights>> =
        await this.client.get(`/${postId}/insights`, {
          params: {
            metric: metrics,
            access_token: accessToken,
          },
        })

      if (response.data.error) {
        throw new MetaAPIError(
          response.data.error.message,
          response.data.error
        )
      }

      if (!response.data.data) {
        throw new MetaAPIError('No insights data returned')
      }

      return response.data.data
    } catch (error: any) {
      if (error instanceof MetaAPIError) throw error
      throw new MetaAPIError(
        `Failed to get post insights: ${error.message}`,
        error.response?.data?.error
      )
    }
  }

  // 获取 Page 状态
  async getPageStatus(
    pageId: string,
    accessToken: string
  ): Promise<{
    isPublished: boolean
    isUnpublished: boolean
  }> {
    try {
      const response: AxiosResponse<
        MetaAPIResponse<{ is_published: boolean }>
      > = await this.client.get(`/${pageId}`, {
        params: {
          fields: 'is_published',
          access_token: accessToken,
        },
      })

      if (response.data.error) {
        throw new MetaAPIError(
          response.data.error.message,
          response.data.error
        )
      }

      const isPublished = response.data.data?.is_published ?? true
      return {
        isPublished,
        isUnpublished: !isPublished,
      }
    } catch (error: any) {
      if (error instanceof MetaAPIError) throw error
      throw new MetaAPIError(
        `Failed to get page status: ${error.message}`,
        error.response?.data?.error
      )
    }
  }
}

// 导出单例
export const metaClient = new MetaClient()

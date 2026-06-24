import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { META_API } from '@/lib/constants'
import { MetaAPIError } from '@/lib/errors'
import {
  MetaPageInfo,
  MetaTokenInfo,
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
      const response: AxiosResponse<
        MetaAPIResponse<MetaPublishVideoResponse> | MetaPublishVideoResponse
      > = await this.client.post(`/${pageId}/videos`, {
        access_token: accessToken,
        file_url: videoUrl,
        title,
        description,
        published: true,
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
      throw new MetaAPIError(
        `Failed to publish video: ${error.message}`,
        error.response?.data?.error
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

// Meta API Mock 实现
// 在真实环境中替换为真实 API 调用
import {
  MetaPageInfo,
  MetaTokenInfo,
  MetaUserPageAccount,
  MetaPostInsights,
  MetaPublishVideoResponse,
} from './types'
import { delay } from '@/lib/delay'

// 模拟延迟
const mockDelay = () => delay(Math.random() * 1000 + 500)

export class MockMetaClient {
  // 验证 Token
  async validatePageToken(accessToken: string): Promise<MetaTokenInfo> {
    await mockDelay()
    
    // 模拟有效 token
    if (accessToken && accessToken.length > 10) {
      return {
        app_id: process.env.META_APP_ID || 'mock_app_id',
        type: 'PAGE',
        application: 'Drama CPS Tracker',
        data_access_expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 60, // 60 days
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 60,
        is_valid: true,
        scopes: [
          'pages_manage_posts',
          'pages_read_engagement',
          'pages_read_user_content',
          'pages_show_list',
        ],
        user_id: 'mock_user_id',
      }
    }
    
    throw new Error('Invalid token')
  }

  async getUserPages(userAccessToken: string): Promise<MetaUserPageAccount[]> {
    await mockDelay()

    return [
      {
        id: '123456789012345',
        name: 'Mock Drama Page',
        access_token: 'mock-page-access-token',
        category: 'Entertainment',
        tasks: ['CREATE_CONTENT', 'MANAGE'],
      },
    ]
  }

  // 获取 Page 信息
  async getPageInfo(
    pageId: string,
    accessToken: string
  ): Promise<MetaPageInfo> {
    await mockDelay()
    
    // 模拟页面数据
    return {
      id: pageId,
      name: `Mock Page ${pageId}`,
      category: 'Entertainment',
      fan_count: Math.floor(Math.random() * 100000) + 10000,
      cover: {
        source: 'https://picsum.photos/820/312',
      },
      picture: {
        data: {
          url: 'https://picsum.photos/100/100',
        },
      },
    }
  }

  // 发布视频
  async publishVideoToPage(
    pageId: string,
    accessToken: string,
    videoUrl: string,
    title: string,
    description: string
  ): Promise<MetaPublishVideoResponse> {
    await mockDelay()
    
    // 模拟发布成功
    const postId = `${pageId}_${Date.now()}`
    return {
      id: `${postId}_video`,
      post_id: postId,
    }
  }

  // 获取帖子 Insights
  async getPostInsights(
    postId: string,
    accessToken: string
  ): Promise<MetaPostInsights> {
    await mockDelay()
    
    // 模拟 insights 数据
    return {
      data: [
        {
          name: 'post_impressions',
          period: 'lifetime',
          values: [{ value: Math.floor(Math.random() * 10000) + 1000 }],
          title: 'Post Impressions',
          description: 'Total number of times the post has been seen.',
        },
        {
          name: 'post_reactions_by_type_total',
          period: 'lifetime',
          values: [
            {
              value: {
                like: Math.floor(Math.random() * 500) + 50,
                love: Math.floor(Math.random() * 100) + 10,
                haha: Math.floor(Math.random() * 50) + 5,
                wow: Math.floor(Math.random() * 30) + 3,
                sad: Math.floor(Math.random() * 20) + 2,
                angry: Math.floor(Math.random() * 10) + 1,
              },
            },
          ],
          title: 'Reactions by Type',
          description: 'Total number of reactions by type.',
        },
        {
          name: 'post_clicks',
          period: 'lifetime',
          values: [{ value: Math.floor(Math.random() * 1000) + 100 }],
          title: 'Post Clicks',
          description: 'Total number of clicks on the post.',
        },
        {
          name: 'post_video_views',
          period: 'lifetime',
          values: [{ value: Math.floor(Math.random() * 5000) + 500 }],
          title: 'Video Views',
          description: 'Total number of times the video has been viewed.',
        },
      ],
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
    await mockDelay()
    
    // 模拟页面状态
    return {
      isPublished: true,
      isUnpublished: false,
    }
  }
}

// 导出单例
export const mockMetaClient = new MockMetaClient()

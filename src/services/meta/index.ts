import { MetaClient, metaClient } from './client'
import { MockMetaClient, mockMetaClient } from './mock'

// 只有显式开启 USE_META_MOCK=true 时才使用 Mock，避免生产环境“假发布成功”
const useMock = process.env.USE_META_MOCK === 'true'

export const getMetaClient = () => {
  return useMock ? mockMetaClient : metaClient
}

// 导出便捷函数
export async function getPageInfo(pageAccessToken: string, pageId?: string) {
  const client = getMetaClient()
  if (!pageId) throw new Error('Page ID is required')
  return client.getPageInfo(pageId, pageAccessToken)
}

export async function validatePageToken(pageAccessToken: string) {
  const client = getMetaClient()
  return client.validatePageToken(pageAccessToken)
}

export async function publishVideoToPage(
  pageId: string,
  pageAccessToken: string,
  videoUrl: string,
  title: string,
  description: string
) {
  const client = getMetaClient()
  return client.publishVideoToPage(pageId, pageAccessToken, videoUrl, title, description)
}

export async function getPostInsights(postId: string, pageAccessToken: string) {
  const client = getMetaClient()
  return client.getPostInsights(postId, pageAccessToken)
}

export async function getPageStatus(pageId: string, pageAccessToken: string) {
  const client = getMetaClient()
  return client.getPageStatus(pageId, pageAccessToken)
}

export async function refreshPageData(pageId: string, pageAccessToken: string) {
  const client = getMetaClient()
  const [pageInfo, pageStatus] = await Promise.all([
    client.getPageInfo(pageId, pageAccessToken),
    client.getPageStatus(pageId, pageAccessToken),
  ])
  
  return {
    ...pageInfo,
    ...pageStatus,
  }
}

// 导出类型
export type { MetaPageInfo, MetaTokenInfo, MetaPostInsights } from './types'
export { MetaClient } from './client'
export { MockMetaClient } from './mock'

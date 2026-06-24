import { pageService } from '@/services/database/pages'
import { publishTaskService } from '@/services/database/publish-tasks'
import { publishVideoToPage } from '@/services/meta'
import { addInsightsJob } from '@/services/queue'

function compactTitle(title: string) {
  const normalized = title.replace(/\s+/g, ' ').trim()
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized
}

export async function executePublishTask(taskId: string, options: { origin?: string } = {}) {
  await publishTaskService.updateTaskStatus(taskId, 'PROCESSING')

  try {
    const task = await publishTaskService.getTaskById(taskId)
    const page = task.page
    const video = task.video
    const variant = task.variant

    if (page.status !== 'ACTIVE') {
      throw new Error(`Page ${page.pageName} is not active (status: ${page.status})`)
    }

    const canPublish = await pageService.checkDailyLimit(page.id)
    if (!canPublish) {
      throw new Error(`Page ${page.pageName} has reached daily limit`)
    }

    if (page.healthScore < 60) {
      throw new Error(`Page ${page.pageName} health score is too low (${page.healthScore})`)
    }

    const marketingCopy = variant.caption || variant.title || ''
    const hashtags = (variant.hashtags || []).map(tag => `#${tag.replace(/^#/, '')}`)
    const title = compactTitle(variant.title || video.title || variant.variantName)
    const description = [
      marketingCopy,
      '',
      ...hashtags,
    ].filter((line, index, lines) => line || lines[index - 1]).join('\n')

    const result = await publishVideoToPage(
      page.pageId,
      page.accessToken,
      video.fileUrl,
      title,
      description
    )

    await publishTaskService.updateTaskStatus(taskId, 'PUBLISHED', {
      fbPostId: result.post_id,
      fbVideoId: result.id,
      fbPostUrl: `https://facebook.com/${result.post_id}`,
    })

    await scheduleInsightsSync(taskId, page.id, page.accessToken, result.post_id, result.id)

    return {
      success: true,
      postId: result.post_id,
      videoId: result.id,
    }
  } catch (error: any) {
    await publishTaskService.updateTaskStatus(taskId, 'FAILED', {
      errorMessage: error.message,
    })
    throw error
  }
}

async function scheduleInsightsSync(
  taskId: string,
  pageId: string,
  pageAccessToken: string,
  postId: string,
  videoId: string
) {
  try {
    await Promise.all([
      addInsightsJob({ taskId, postId, videoId, pageId, pageAccessToken }),
      addInsightsJob({
        taskId,
        postId,
        videoId,
        pageId,
        pageAccessToken,
        delayMs: 30 * 60 * 1000,
      }),
    ])
  } catch (error) {
    console.warn(`Failed to enqueue insights sync for task ${taskId}:`, error)
  }
}

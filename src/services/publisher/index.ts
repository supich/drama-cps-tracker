import { pageService } from '@/services/database/pages'
import { publishTaskService } from '@/services/database/publish-tasks'
import { publishVideoToPage } from '@/services/meta'

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
      fbPostUrl: `https://facebook.com/${result.post_id}`,
    })

    return {
      success: true,
      postId: result.post_id,
    }
  } catch (error: any) {
    await publishTaskService.updateTaskStatus(taskId, 'FAILED', {
      errorMessage: error.message,
    })
    throw error
  }
}

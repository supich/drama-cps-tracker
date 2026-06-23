export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /go - CPS跳转追踪
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dramaId = searchParams.get('drama_id')
    const pageId = searchParams.get('page_id')
    const videoId = searchParams.get('video_id')
    const variantId = searchParams.get('variant_id')
    
    // 获取真实的目标URL
    let targetUrl = process.env.DEFAULT_CPS_URL || 'https://example.com'
    
    // 如果有dramaId，获取剧集的CPS链接
    if (dramaId) {
      const drama = await prisma.drama.findUnique({
        where: { id: dramaId },
        select: { cpsBaseUrl: true },
      })
      
      if (drama?.cpsBaseUrl) {
        targetUrl = drama.cpsBaseUrl
      }
    }
    
    // 如果有variantId，获取变体对应的视频CPS链接
    if (variantId && !dramaId) {
      const variant = await prisma.videoVariant.findUnique({
        where: { id: variantId },
        include: {
          video: {
            include: { drama: true },
          },
        },
      })
      
      if (variant?.video?.drama?.cpsBaseUrl) {
        targetUrl = variant.video.drama.cpsBaseUrl
      }
    }
    
    // 构建追踪参数
    const trackingParams = new URLSearchParams()
    if (dramaId) trackingParams.set('drama_id', dramaId)
    if (pageId) trackingParams.set('page_id', pageId)
    if (videoId) trackingParams.set('video_id', videoId)
    if (variantId) trackingParams.set('variant_id', variantId)
    trackingParams.set('click_id', Date.now().toString(36))
    
    // 将追踪参数添加到目标URL
    const separator = targetUrl.includes('?') ? '&' : '?'
    const finalUrl = `${targetUrl}${separator}${trackingParams.toString()}`
    
    // 获取请求信息
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || ''
    
    // 异步记录点击日志（不阻塞跳转）
    prisma.clickLog.create({
      data: {
        dramaId: dramaId || undefined,
        pageId: pageId || undefined,
        videoId: videoId || undefined,
        variantId: variantId || undefined,
        ip: ip.split(',')[0].trim(),
        userAgent,
        referer,
        targetUrl: finalUrl,
      },
    }).catch(error => {
      console.error('Failed to log click:', error)
    })
    
    // 更新点击计数（异步）
    if (pageId && videoId && variantId) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      prisma.performanceLog.upsert({
        where: {
          pageId_videoId_variantId_date: {
            pageId,
            videoId,
            variantId,
            date: today,
          },
        },
        update: {
          clicks: { increment: 1 },
        },
        create: {
          pageId,
          videoId,
          variantId,
          clicks: 1,
          date: today,
        },
      }).catch(error => {
        console.error('Failed to update click count:', error)
      })
    }
    
    // 302跳转到目标URL
    return NextResponse.redirect(finalUrl, 302)
  } catch (error) {
    console.error('Click tracking error:', error)
    // 出错时跳转到默认URL
    return NextResponse.redirect(process.env.DEFAULT_CPS_URL || 'https://example.com', 302)
  }
}
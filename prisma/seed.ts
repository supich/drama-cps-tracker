import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  
  // 创建管理员用户
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      // 密码: admin123 (在生产环境中应该使用加密)
      passwordHash: '$2a$12$LJ3XFiDFMIMVs0x5P1tKXOuJQJ3bYJfE6YJfE6YJfE6YJfE6YJfE6',
    },
  })
  
  // 创建系统设置
  const defaultSettings = [
    { key: 'DAILY_POST_LIMIT', value: '10', description: 'Default daily post limit per page' },
    { key: 'MIN_STAGGER_INTERVAL', value: '15', description: 'Minimum stagger interval in minutes' },
    { key: 'MAX_STAGGER_INTERVAL', value: '90', description: 'Maximum stagger interval in minutes' },
    { key: 'MAX_RETRY_COUNT', value: '2', description: 'Maximum retry count for failed tasks' },
    { key: 'CONSECUTIVE_FAIL_THRESHOLD', value: '3', description: 'Consecutive failures to pause page' },
    { key: 'HEALTH_SCORE_THRESHOLD', value: '60', description: 'Minimum health score to continue publishing' },
    { key: 'INSIGHTS_SYNC_INTERVAL', value: '30', description: 'Insights sync interval in minutes' },
    { key: 'HEALTH_CHECK_INTERVAL', value: '60', description: 'Health check interval in minutes' },
  ]
  
  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    })
  }
  
  // 创建示例 Facebook Page
  const samplePages = [
    {
      pageId: '123456789012345',
      pageName: 'Drama Enthusiasts US',
      accessToken: 'sample-token-1',
      status: 'ACTIVE' as const,
      niche: '情感',
      region: 'US',
      language: 'en',
      timezone: 'America/New_York',
      dailyPostLimit: 8,
      healthScore: 95,
      fansCount: 125000,
    },
    {
      pageId: '234567890123456',
      pageName: 'Asian Drama Fans',
      accessToken: 'sample-token-2',
      status: 'ACTIVE' as const,
      niche: '逆袭',
      region: 'SEA',
      language: 'zh',
      timezone: 'Asia/Shanghai',
      dailyPostLimit: 12,
      healthScore: 88,
      fansCount: 85000,
    },
    {
      pageId: '345678901234567',
      pageName: 'Latin Drama Passion',
      accessToken: 'sample-token-3',
      status: 'ACTIVE' as const,
      niche: '甜宠',
      region: 'LATAM',
      language: 'es',
      timezone: 'America/Mexico_City',
      dailyPostLimit: 6,
      healthScore: 72,
      fansCount: 45000,
    },
  ]
  
  const createdPages = []
  for (const page of samplePages) {
    const createdPage = await prisma.facebookPage.upsert({
      where: { pageId: page.pageId },
      update: page,
      create: page,
    })
    createdPages.push(createdPage)
  }
  
  // 创建示例剧集
  const sampleDramas = [
    {
      dramaName: 'Heartbeat of the City',
      description: 'A romantic drama about finding love in the big city',
      language: 'en',
      tags: ['romantic', 'urban', 'modern'],
      cpsBaseUrl: 'https://example.com/cps/drama1',
    },
    {
      dramaName: '逆袭人生',
      description: '一个普通人在商界逆袭的故事',
      language: 'zh',
      tags: ['逆袭', '商战', '励志'],
      cpsBaseUrl: 'https://example.com/cps/drama2',
    },
    {
      dramaName: 'Amor Dulce',
      description: 'Una historia de amor dulce y conmovedora',
      language: 'es',
      tags: ['romance', 'sweet', 'emotional'],
      cpsBaseUrl: 'https://example.com/cps/drama3',
    },
  ]
  
  const createdDramas = []
  for (const drama of sampleDramas) {
    const createdDrama = await prisma.drama.create({
      data: drama,
    })
    createdDramas.push(createdDrama)
  }
  
  // 创建示例视频
  const sampleVideos = [
    {
      dramaId: createdDramas[0].id,
      title: 'Heartbeat of the City - Episode 1',
      description: 'First episode of the romantic drama',
      fileUrl: '/uploads/videos/drama1_ep1.mp4',
      coverUrl: '/uploads/covers/drama1_ep1.jpg',
      duration: 1800,
      language: 'en',
      tags: ['romantic', 'episode1'],
      status: 'READY' as const,
    },
    {
      dramaId: createdDramas[1].id,
      title: '逆袭人生 - 第一集',
      description: '逆袭人生的第一集',
      fileUrl: '/uploads/videos/drama2_ep1.mp4',
      coverUrl: '/uploads/covers/drama2_ep1.jpg',
      duration: 2100,
      language: 'zh',
      tags: ['逆袭', '第一集'],
      status: 'READY' as const,
    },
    {
      dramaId: createdDramas[2].id,
      title: 'Amor Dulce - Episodio 1',
      description: 'Primer episodio del drama romántico',
      fileUrl: '/uploads/videos/drama3_ep1.mp4',
      coverUrl: '/uploads/covers/drama3_ep1.jpg',
      duration: 1500,
      language: 'es',
      tags: ['romance', 'episodio1'],
      status: 'READY' as const,
    },
  ]
  
  const createdVideos = []
  for (const video of sampleVideos) {
    const createdVideo = await prisma.video.create({
      data: video,
    })
    createdVideos.push(createdVideo)
  }
  
  // 创建示例变体
  for (const video of createdVideos) {
    const variantCount = video.language === 'en' ? 3 : 2
    
    for (let i = 1; i <= variantCount; i++) {
      const variantData = {
        videoId: video.id,
        variantName: `Variant ${i}`,
        title: `${video.title} - Variant ${i}`,
        caption: `Check out this amazing ${video.language === 'en' ? 'drama' : video.language === 'zh' ? '剧集' : 'drama'}! #${video.tags[0]} #${video.language}`,
        hookType: ['suspense', 'emotional', 'conflict'][i % 3],
        ctaType: ['watch_now', 'free_episode', 'continue_watching'][i % 3],
        hashtags: video.tags,
        status: 'READY' as const,
      }
      
      await prisma.videoVariant.create({
        data: variantData,
      })
    }
  }
  
  console.log('Database seeded successfully!')
  console.log(`Created ${createdPages.length} Facebook Pages`)
  console.log(`Created ${createdDramas.length} Dramas`)
  console.log(`Created ${createdVideos.length} Videos`)
  console.log(`Created ${createdVideos.length * 2}-${createdVideos.length * 3} Variants`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
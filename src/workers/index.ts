"use server"

// 导入所有 worker
import './publish-worker'
import './insights-worker'
import './health-worker'

console.log('All workers started successfully')

// 保持进程运行
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down workers...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down workers...')
  process.exit(0)
})

// 错误处理
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)
})
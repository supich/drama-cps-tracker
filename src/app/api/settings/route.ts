export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError, successResponse } from '@/lib/errors'
import { settingsService } from '@/services/database/settings'

const updateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })),
})

export async function GET() {
  try {
    const settings = await settingsService.getSettings()
    return NextResponse.json(successResponse({ settings }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)
    const settings = await settingsService.updateSettings(validatedData.settings)

    return NextResponse.json(successResponse({ settings }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

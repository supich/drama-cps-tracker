// 自定义错误类
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      404,
      'NOT_FOUND'
    )
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class MetaAPIError extends AppError {
  constructor(
    message: string,
    public metaError?: any,
    public statusCode: number = 400
  ) {
    super(message, statusCode, 'META_API_ERROR')
    this.name = 'MetaAPIError'
  }
}

// 错误处理函数
export function handleApiError(error: unknown) {
  console.error('API Error:', error)
  
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
      statusCode: error.statusCode,
    }
  }
  
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: 'INTERNAL_ERROR',
      },
      statusCode: 500,
    }
  }
  
  return {
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    statusCode: 500,
  }
}

// 成功响应
export function successResponse(data: any, statusCode: number = 200) {
  return {
    success: true,
    data,
    statusCode,
  }
}
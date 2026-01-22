/**
 * 简单的日志工具
 * 提供 error、warn、info 三个级别
 */

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development'

  /**
   * 记录错误日志
   * @param message 错误消息
   * @param error 错误对象或额外数据
   */
  error(message: string, error?: any): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '')
    } else {
      console.error(`[ERROR] ${message}`)
    }
  }

  /**
   * 记录警告日志
   * @param message 警告消息
   * @param data 额外数据
   */
  warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '')
    } else {
      console.warn(`[WARN] ${message}`)
    }
  }

  /**
   * 记录信息日志
   * @param message 信息消息
   * @param data 额外数据
   */
  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data || '')
    } else {
      // 生产环境可以选择不输出 info 日志
      // console.info(`[INFO] ${message}`)
    }
  }

  /**
   * 记录调试日志（仅在开发环境）
   * @param message 调试消息
   * @param data 额外数据
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '')
    }
  }
}

// 导出单例
export const logger = new Logger()

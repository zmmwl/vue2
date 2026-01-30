/**
 * 文件下载工具
 * 将数据转换为 Blob 并触发浏览器下载
 */

import type { ExportJson } from '@/types/export'

/**
 * 将 JSON 对象转换为 Blob
 */
function jsonToBlob(json: ExportJson): Blob {
  const jsonString = JSON.stringify(json, null, 2)
  return new Blob([jsonString], { type: 'application/json' })
}

/**
 * 生成默认文件名（使用 jobId）
 */
function generateFileName(json: ExportJson): string {
  return `${json.jobId}.json`
}

/**
 * 触发浏览器下载
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 下载 JSON 文件
 *
 * @param json - 导出的 JSON 对象
 * @param filename - 可选的自定义文件名（默认使用 jobId）
 */
export function downloadJsonFile(json: ExportJson, filename?: string): void {
  const blob = jsonToBlob(json)
  const finalFilename = filename || generateFileName(json)
  triggerDownload(blob, finalFilename)
}

/**
 * 验证 JSON 对象是否符合 ExportJson 格式
 */
export function validateExportJson(json: any): json is ExportJson {
  return (
    typeof json === 'object' &&
    json !== null &&
    typeof json.jobId === 'string' &&
    Array.isArray(json.participantList) &&
    Array.isArray(json.taskList)
  )
}

/**
 * 联邦学习任务模板定义
 * 包含菜单结构和任务模板
 */

import type { FLMenuSection, FLTaskCategoryMenu, FLTaskMenuItem } from '@/types/fl-tasks'
import { FLTaskCategory, FLMode } from '@/types/fl-tasks'
import {
  PREPROCESS_TEMPLATES,
  FEATURE_ENGINEERING_TEMPLATES,
  HORIZONTAL_MODEL_TEMPLATES,
  VERTICAL_MODEL_TEMPLATES
} from '@/utils/mock-fl-data'

// ========== 联邦学习训练菜单 ==========

/** 预处理任务菜单 */
const preprocessTrainingCategory: FLTaskCategoryMenu = {
  name: '预处理',
  category: FLTaskCategory.PREPROCESS,
  icon: '🧹',
  tasks: PREPROCESS_TEMPLATES.map(t => ({
    name: t.displayName,
    taskName: t.taskName,
    icon: t.icon,
    description: t.description
  }))
}

/** 特征工程任务菜单 */
const featureEngineeringTrainingCategory: FLTaskCategoryMenu = {
  name: '特征工程',
  category: FLTaskCategory.FEATURE_ENGINEERING,
  icon: '📊',
  tasks: FEATURE_ENGINEERING_TEMPLATES.map(t => ({
    name: t.displayName,
    taskName: t.taskName,
    icon: t.icon,
    description: t.description
  }))
}

/** 横向模型任务菜单 */
const horizontalModelTrainingCategory: FLTaskCategoryMenu = {
  name: '横向模型',
  category: FLTaskCategory.HORIZONTAL_MODEL,
  icon: '🤖',
  tasks: HORIZONTAL_MODEL_TEMPLATES.map(t => ({
    name: t.displayName,
    taskName: t.taskName,
    icon: t.icon,
    description: t.description
  }))
}

/** 纵向模型任务菜单 */
const verticalModelTrainingCategory: FLTaskCategoryMenu = {
  name: '纵向模型',
  category: FLTaskCategory.VERTICAL_MODEL,
  icon: '🔗',
  tasks: VERTICAL_MODEL_TEMPLATES.map(t => ({
    name: t.displayName,
    taskName: t.taskName,
    icon: t.icon,
    description: t.description
  }))
}

/** 联邦学习训练菜单 */
export const FL_TRAINING_MENU: FLMenuSection = {
  title: '联邦学习训练',
  mode: FLMode.TRAINING,
  categories: [
    preprocessTrainingCategory,
    featureEngineeringTrainingCategory,
    horizontalModelTrainingCategory,
    verticalModelTrainingCategory
  ]
}

// ========== 联邦学习推断菜单 ==========

/** 预处理推断菜单（与训练相同任务列表） */
const preprocessInferenceCategory: FLTaskCategoryMenu = {
  name: '预处理',
  category: FLTaskCategory.PREPROCESS,
  icon: '🧹',
  tasks: PREPROCESS_TEMPLATES.map(t => ({
    name: t.displayName,
    taskName: t.taskName,
    icon: t.icon,
    description: t.description
  }))
}

/** 特征工程推断菜单 */
const featureEngineeringInferenceCategory: FLTaskCategoryMenu = {
  name: '特征工程',
  category: FLTaskCategory.FEATURE_ENGINEERING,
  icon: '📊',
  tasks: FEATURE_ENGINEERING_TEMPLATES.map(t => ({
    name: t.displayName,
    taskName: t.taskName,
    icon: t.icon,
    description: t.description
  }))
}

/** 横向模型推断菜单 */
const horizontalModelInferenceCategory: FLTaskCategoryMenu = {
  name: '横向模型',
  category: FLTaskCategory.HORIZONTAL_MODEL,
  icon: '🤖',
  tasks: HORIZONTAL_MODEL_TEMPLATES.map(t => ({
    name: t.displayName,
    taskName: t.taskName,
    icon: t.icon,
    description: t.description
  }))
}

/** 纵向模型推断菜单 */
const verticalModelInferenceCategory: FLTaskCategoryMenu = {
  name: '纵向模型',
  category: FLTaskCategory.VERTICAL_MODEL,
  icon: '🔗',
  tasks: VERTICAL_MODEL_TEMPLATES.map(t => ({
    name: t.displayName,
    taskName: t.taskName,
    icon: t.icon,
    description: t.description
  }))
}

/** 联邦学习推断菜单 */
export const FL_INFERENCE_MENU: FLMenuSection = {
  title: '联邦学习推断',
  mode: FLMode.INFERENCE,
  categories: [
    preprocessInferenceCategory,
    featureEngineeringInferenceCategory,
    horizontalModelInferenceCategory,
    verticalModelInferenceCategory
  ]
}

// ========== 联邦学习任务节点颜色 ==========

/** 获取 FL 任务类别对应的颜色 */
export function getFLCategoryColor(category: FLTaskCategory): string {
  const colors: Record<FLTaskCategory, string> = {
    [FLTaskCategory.PREPROCESS]: '#52C41A',      // 绿色
    [FLTaskCategory.FEATURE_ENGINEERING]: '#1890FF',  // 蓝色
    [FLTaskCategory.HORIZONTAL_MODEL]: '#722ED1',     // 紫色
    [FLTaskCategory.VERTICAL_MODEL]: '#FA8C16'        // 橙色
  }
  return colors[category]
}

/** 获取 FL 模式显示文本 */
export function getFLModeLabel(mode: FLMode): string {
  return mode === FLMode.TRAINING ? '训练' : '推断'
}

// ========== 根据 taskName 获取任务信息 ==========

/** 获取任务模板信息 */
export function getFLTaskInfo(taskName: string): FLTaskMenuItem | undefined {
  const allTasks = [
    ...FL_TRAINING_MENU.categories.flatMap(c => c.tasks),
    ...FL_INFERENCE_MENU.categories.flatMap(c => c.tasks)
  ]
  return allTasks.find(t => t.taskName === taskName)
}

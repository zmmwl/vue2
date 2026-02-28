<template>
  <div class="algorithm-manager">
    <!-- 顶部导航栏 -->
    <header class="manager-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
          <span>返回</span>
        </button>
        <h1 class="page-title">算法管理</h1>
      </div>
      <div class="header-right">
        <button class="primary-btn" @click="handleCreateAlgorithm">
          + 注册新算法
        </button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="manager-content">
      <AlgorithmList :key="listKey" />
    </main>

    <!-- 算法表单对话框 -->
    <div v-if="showAlgorithmForm" class="dialog-overlay" @click.self="closeForm">
      <div class="dialog-content">
        <div class="dialog-header">
          <h2>{{ isEditMode ? '编辑算法' : '注册新算法' }}</h2>
          <button class="close-btn" @click="closeForm">×</button>
        </div>
        <div class="dialog-body">
          <AlgorithmForm
            :edit-algorithm="editingAlgorithm"
            @save="handleSave"
            @cancel="closeForm"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AlgorithmList from '@/components/Algorithm/AlgorithmList.vue'
import AlgorithmForm from '@/components/Algorithm/AlgorithmForm.vue'
import type { Algorithm } from '@/types/algorithm'

const router = useRouter()

const showAlgorithmForm = ref(false)
const isEditMode = ref(false)
const editingAlgorithm = ref<Algorithm | null>(null)
const listKey = ref(0)

function goBack() {
  router.push('/')
}

function handleCreateAlgorithm() {
  isEditMode.value = false
  editingAlgorithm.value = null
  showAlgorithmForm.value = true
}

function closeForm() {
  showAlgorithmForm.value = false
  editingAlgorithm.value = null
}

function handleSave() {
  closeForm()
  // 刷新列表（通过 key 强制重新渲染）
  listKey.value++
}
</script>

<style scoped lang="scss">
.algorithm-manager {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.manager-header {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  color: #666666;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    border-color: #1890ff;
    color: #1890ff;
  }

  .back-icon {
    font-size: 14px;
  }
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.primary-btn {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
  background: #1890ff;
  border: 1px solid #1890ff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #40a9ff;
    border-color: #40a9ff;
  }
}

.manager-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 对话框样式
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: #ffffff;
  border-radius: 8px;
  width: 720px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #000000;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #999999;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f5f5f5;
      color: #666666;
    }
  }
}

.dialog-body {
  padding: 24px;
  flex: 1;
  overflow: auto;
}
</style>

<template>
  <header class="flow-header">
    <div class="header-left">
      <h1 class="header-title">隐私计算任务流</h1>
      <span class="header-status">未保存</span>
    </div>
    <div class="header-right">
      <button class="header-btn primary">运行</button>
      <button class="header-btn" @click="handleAutoLayout" title="一键调整布局">自动布局</button>
      <button class="header-btn">保存</button>
      <button class="header-btn" @click="handleExport">导出</button>
      <button class="header-btn" @click="handleImport">导入</button>

      <!-- 设置下拉菜单 -->
      <div class="settings-dropdown" ref="dropdownRef">
        <button class="header-btn" @click="toggleDropdown">
          设置
          <span class="dropdown-arrow" :class="{ open: isDropdownOpen }">▼</span>
        </button>
        <div class="dropdown-menu" v-show="isDropdownOpen">
          <div class="dropdown-item" @click="handleAlgorithmManager">
            <span class="item-icon">⚙️</span>
            <span class="item-text">算法管理</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

interface Emits {
  (e: 'export'): void
  (e: 'import'): void
  (e: 'autoLayout'): void
}

const emit = defineEmits<Emits>()
const router = useRouter()

const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function handleExport() {
  emit('export')
}

function handleImport() {
  emit('import')
}

function handleAutoLayout() {
  emit('autoLayout')
}

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function closeDropdown() {
  isDropdownOpen.value = false
}

function handleAlgorithmManager() {
  closeDropdown()
  router.push('/algorithm-manager')
}

// 点击外部关闭下拉菜单
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
.flow-header {
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin: 0;
}

.header-status {
  font-size: 12px;
  color: #666666;
  padding: 4px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #666666;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: #f5f5f5;
    border-color: #1890ff;
    color: #1890ff;
  }

  &.primary {
    background: #1890ff;
    color: #ffffff;
    border-color: #1890ff;

    &:hover {
      background: #40a9ff;
      border-color: #40a9ff;
      color: #ffffff;
    }
  }
}

.dropdown-arrow {
  font-size: 10px;
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(180deg);
  }
}

.settings-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 160px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }

  .item-icon {
    font-size: 14px;
  }

  .item-text {
    font-size: 13px;
    color: #333333;
  }
}
</style>

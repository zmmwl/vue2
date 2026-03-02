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
        <button
          class="header-btn"
          @click="toggleDropdown"
          @keydown="handleDropdownKeydown"
          :aria-expanded="isDropdownOpen"
          aria-haspopup="true"
        >
          设置
          <span class="dropdown-arrow" :class="{ open: isDropdownOpen }">▼</span>
        </button>
        <div class="dropdown-menu" v-show="isDropdownOpen" role="menu">
          <button
            class="dropdown-item"
            role="menuitem"
            tabindex="0"
            @click="handleAlgorithmManager"
            @keydown="handleMenuItemKeydown"
          >
            <span class="item-icon">⚙️</span>
            <span class="item-text">算法管理</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
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

/**
 * 处理下拉菜单键盘事件
 */
function handleDropdownKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleDropdown()
    // 打开后聚焦到第一个菜单项
    if (isDropdownOpen.value) {
      nextTick(() => {
        const firstItem = dropdownRef.value?.querySelector('.dropdown-item') as HTMLElement
        firstItem?.focus()
      })
    }
  } else if (event.key === 'Escape') {
    closeDropdown()
  } else if (event.key === 'ArrowDown' && isDropdownOpen.value) {
    event.preventDefault()
    const firstItem = dropdownRef.value?.querySelector('.dropdown-item') as HTMLElement
    firstItem?.focus()
  }
}

/**
 * 处理菜单项键盘事件
 */
function handleMenuItemKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeDropdown()
    // 将焦点返回到下拉按钮
    const btn = dropdownRef.value?.querySelector('.header-btn') as HTMLElement
    btn?.focus()
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleAlgorithmManager()
  }
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
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  font-size: inherit;

  &:hover,
  &:focus {
    background: #f5f5f5;
  }

  &:focus-visible {
    outline: 2px solid #1890ff;
    outline-offset: -2px;
    background: #e6f7ff;
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

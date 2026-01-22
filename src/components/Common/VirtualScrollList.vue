<template>
  <div
    ref="containerRef"
    class="virtual-scroll-list"
    :style="{ height: `${containerHeight}px` }"
    @scroll="onScroll"
  >
    <div
      class="virtual-scroll-spacer"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        class="virtual-scroll-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="indexMap.get(item) || getItemKey(item, filteredItems.indexOf(item))"
          :class="['virtual-scroll-item', { 'is-selected': isSelected(item) }]"
          :style="{ height: `${itemHeight}px` }"
          @click="handleClick(item)"
        >
          <slot name="default" :item="item" :index="filteredItems.indexOf(item)">
            <div class="virtual-scroll-item-content">
              {{ item }}
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredItems.length === 0" class="virtual-scroll-empty">
      <slot name="empty">
        <div class="empty-state">
          <p>未找到匹配结果</p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends any">
import { ref, computed, watch } from 'vue'

interface Props {
  items: T[]                              // 列表数据
  itemHeight: number                      // 单项高度（px）
  containerHeight: number                 // 容器高度（px）
  searchQuery?: string                    // 搜索关键词（可选）
  searchField?: string                    // 搜索字段（可选）
  selectedItems?: Set<any>                // 已选项集合（可选）
  multiple?: boolean                      // 是否多选（默认 true）
}

interface Emits {
  (e: 'update:selectedItems', value: Set<any>): void
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  searchField: '',
  selectedItems: () => new Set<any>(),
  multiple: true
})

const emit = defineEmits<Emits>()

// Refs
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)

// 过滤后的列表
const filteredItems = computed(() => {
  if (!props.searchQuery || !props.searchField) {
    return props.items
  }

  const query = props.searchQuery.toLowerCase()
  return props.items.filter(item => {
    const value = (item as any)[props.searchField]
    return String(value).toLowerCase().includes(query)
  })
})

// 计算总高度
const totalHeight = computed(() => filteredItems.value.length * props.itemHeight)

// 可见项数量（加上缓冲区）
const bufferSize = 5
const visibleCount = computed(() => Math.ceil(props.containerHeight / props.itemHeight) + bufferSize * 2)

// 当前可见项
const startIndex = ref(0)
const endIndex = computed(() => Math.min(startIndex.value + visibleCount.value, filteredItems.value.length))

const visibleItems = computed(() => {
  return filteredItems.value.slice(startIndex.value, endIndex.value)
})

// 偏移量
const offsetY = computed(() => startIndex.value * props.itemHeight)

// 索引映射（用于 key）
const indexMap = computed(() => {
  const map = new Map<any, number>()
  filteredItems.value.forEach((item, index) => {
    map.set(item, index)
  })
  return map
})

// 获取项目唯一 key
function getItemKey(item: T, index: number): string | number {
  if (item && typeof item === 'object' && 'id' in item) {
    return (item as any).id
  }
  if (item && typeof item === 'object' && 'name' in item) {
    return (item as any).name
  }
  return index
}

// 判断是否选中
function isSelected(item: T): boolean {
  if (item && typeof item === 'object' && 'id' in item) {
    return props.selectedItems.has((item as any).id)
  }
  return props.selectedItems.has(item)
}

// 处理点击
function handleClick(item: T) {
  const newSelection = new Set(props.selectedItems)

  if (props.multiple) {
    if (item && typeof item === 'object' && 'id' in item) {
      const id = (item as any).id
      if (newSelection.has(id)) {
        newSelection.delete(id)
      } else {
        newSelection.add(id)
      }
    }
  } else {
    newSelection.clear()
    if (item && typeof item === 'object' && 'id' in item) {
      newSelection.add((item as any).id)
    }
  }

  emit('update:selectedItems', newSelection)
}

// 处理滚动
function onScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop

  // 计算新的起始索引
  const newStartIndex = Math.floor(scrollTop.value / props.itemHeight)

  // 调整缓冲区
  if (newStartIndex < startIndex.value + bufferSize - 1) {
    startIndex.value = Math.max(0, newStartIndex - bufferSize)
  } else if (newStartIndex > startIndex.value + bufferSize + 1) {
    startIndex.value = newStartIndex
  }
}

// 监听搜索变化，重置滚动位置
watch(() => props.searchQuery, () => {
  startIndex.value = 0
  scrollTop.value = 0
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
})

// 监听列表变化，重置滚动位置
watch(() => props.items, () => {
  startIndex.value = 0
  scrollTop.value = 0
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
})
</script>

<style scoped lang="scss">
.virtual-scroll-list {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.virtual-scroll-spacer {
  position: relative;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-scroll-item {
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--list-item-hover-bg);
  }

  &.is-selected {
    background-color: var(--list-item-selected-bg);
    border-left: 3px solid var(--list-item-selected-border);
  }
}

.virtual-scroll-item-content {
  flex: 1;
}

.virtual-scroll-empty {
  padding: 32px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-state {
  p {
    margin: 0;
    color: var(--empty-state-text);
  }
}
</style>

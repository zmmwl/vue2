/**
 * Join Validation Unit Tests
 * Tests for join type compatibility validation
 */

import { describe, it, expect } from 'vitest'
import {
  validateJoinTypes,
  areTypesCompatible,
  type JoinValidationResult
} from '@/composables/useJoinValidation'
import type { InputProvider } from '@/types/nodes'

describe('Join Validation', () => {
  describe('areTypesCompatible', () => {
    it('should return true for compatible types', () => {
      expect(areTypesCompatible('INNER', 'INNER')).toBe(true)
      expect(areTypesCompatible('INNER', 'CROSS')).toBe(true)
      expect(areTypesCompatible('INNER', 'NoAssoc')).toBe(true)
      expect(areTypesCompatible('CROSS', 'INNER')).toBe(true)
      expect(areTypesCompatible('CROSS', 'Union')).toBe(true)
      expect(areTypesCompatible('Union', 'CROSS')).toBe(true)
      expect(areTypesCompatible('Union', 'NoAssoc')).toBe(true)
      expect(areTypesCompatible('NoAssoc', 'INNER')).toBe(true)
      expect(areTypesCompatible('NoAssoc', 'CROSS')).toBe(true)
      expect(areTypesCompatible('NoAssoc', 'Union')).toBe(true)
      expect(areTypesCompatible('NoAssoc', 'NoAssoc')).toBe(true)
    })

    it('should return false for incompatible types', () => {
      expect(areTypesCompatible('INNER', 'Union')).toBe(false)
      expect(areTypesCompatible('Union', 'INNER')).toBe(false)
    })
  })

  describe('validateJoinTypes', () => {
    const createProvider = (joinType?: string): InputProvider => ({
      sourceNodeId: 'test-node',
      sourceType: 'dataSource',
      participantId: 'test-participant',
      dataset: 'test-dataset',
      fields: [],
      joinType: joinType as any
    })

    it('should return valid for empty providers', () => {
      const result = validateJoinTypes([])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return valid for single provider', () => {
      const providers = [createProvider('INNER')]
      const result = validateJoinTypes(providers)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return valid for multiple INNER providers', () => {
      const providers = [
        createProvider('INNER'),
        createProvider('INNER')
      ]
      const result = validateJoinTypes(providers)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error when Union and INNER coexist', () => {
      const providers = [
        createProvider('INNER'),
        createProvider('Union')
      ]
      const result = validateJoinTypes(providers)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Union(横向拼接)与 INNER(内连接)不能共存')
    })

    it('should return error when multiple CROSS types exist', () => {
      const providers = [
        createProvider('CROSS'),
        createProvider('CROSS')
      ]
      const result = validateJoinTypes(providers)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('只允许一个输入源使用 CROSS(交叉连接)类型')
    })

    it('should return valid for single CROSS with INNER', () => {
      const providers = [
        createProvider('INNER'),
        createProvider('CROSS')
      ]
      const result = validateJoinTypes(providers)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return valid for single CROSS with Union', () => {
      const providers = [
        createProvider('Union'),
        createProvider('CROSS')
      ]
      const result = validateJoinTypes(providers)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return valid for NoAssoc with any type', () => {
      const providers1 = [createProvider('NoAssoc'), createProvider('INNER')]
      const providers2 = [createProvider('NoAssoc'), createProvider('CROSS')]
      const providers3 = [createProvider('NoAssoc'), createProvider('Union')]

      expect(validateJoinTypes(providers1).valid).toBe(true)
      expect(validateJoinTypes(providers2).valid).toBe(true)
      expect(validateJoinTypes(providers3).valid).toBe(true)
    })

    it('should return warning when all providers are NoAssoc', () => {
      const providers = [
        createProvider('NoAssoc'),
        createProvider('NoAssoc')
      ]
      const result = validateJoinTypes(providers)
      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should return warning for single provider', () => {
      const providers = [createProvider('INNER')]
      const result = validateJoinTypes(providers)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('只有一个数据源，Join 类型设置可能不影响结果')
    })

    it('should handle provider without joinType (default to INNER)', () => {
      const providers = [
        createProvider(undefined), // defaults to INNER
        createProvider('Union')
      ]
      const result = validateJoinTypes(providers)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Union(横向拼接)与 INNER(内连接)不能共存')
    })
  })
})

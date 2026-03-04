/**
 * 模型详情 Mock 服务
 * 用于模拟获取计算模型的详细信息，包括返回参数定义
 *
 * CodeBin 模型说明：
 * - CodeBin 是算术表达式模型或图灵完备的业务逻辑模型
 * - V2/V3.1/V3.2 的区别只是不同的硬件实现，本质功能相同
 * - 不能用于机器学习、PSI、统计等复杂计算
 * - 典型应用：评分卡、风险评分、费用计算、资格评估等
 */

/**
 * 数据类型枚举（与接口文档中的 dataType 对应）
 */
export enum ModelDataType {
  STRING = 1,
  INT = 2,
  BIGINT = 3,
  FLOAT = 4,
  DOUBLE = 5,
  BOOLEAN = 6,
  DATETIME = 7
}

/**
 * 数据类型名称映射
 */
const DATA_TYPE_NAMES: Record<number, string> = {
  1: 'STRING',
  2: 'INT',
  3: 'BIGINT',
  4: 'FLOAT',
  5: 'DOUBLE',
  6: 'BOOLEAN',
  7: 'DATETIME'
}

/**
 * 模型返回参数
 */
export interface ModelReturnParameter {
  fid: string
  name: string
  dataType: number
  isRequired: number
  description: string
}

/**
 * 模型输入参数
 */
export interface ModelInputParameter {
  fid: string
  name: string
  dataSource: string
  dataType: number
  isEncrypt: number
  description: string
}

/**
 * 模型详情响应
 */
export interface ModelDetailResponse {
  code: number
  msg: string
  data: {
    id: string
    partyId: string
    chainId: number
    chainName: string
    name: string
    type: string
    version: string
    category: string
    description: string
    modelFileName: string
    modelFile: null
    modelFileHash: string
    sourceFile: null
    sourceFileName: string
    sourceFileHash: string
    programmingLanguage: string
    methodName: string
    methodDescription: string
    status: number
    createTime: string
    modelParameters: ModelInputParameter[]
    returnParameters: ModelReturnParameter[]
  }
}

/**
 * 创建模型详情的辅助函数
 */
function createModelDetail(
  id: string,
  partyId: string,
  name: string,
  type: string,
  category: string,
  description: string,
  methodName: string,
  methodDescription: string,
  modelParameters: ModelInputParameter[],
  returnParameters: ModelReturnParameter[],
  createTime: string
): ModelDetailResponse['data'] {
  return {
    id,
    partyId,
    chainId: 1,
    chainName: '测试链',
    name,
    type,
    version: type === 'CodeBin-V2' ? '2.0' : type === 'CodeBin-V3-1' ? '3.1' : '3.2',
    category: JSON.stringify([category]),
    description,
    modelFileName: `${id}.py`,
    modelFile: null,
    modelFileHash: `hash_${id}_model`,
    sourceFile: null,
    sourceFileName: `${id}.bin`,
    sourceFileHash: `hash_${id}_source`,
    programmingLanguage: 'Python',
    methodName,
    methodDescription,
    status: 1,
    createTime,
    modelParameters,
    returnParameters
  }
}

/**
 * Mock 模型数据存储
 * 使用 modelId 作为 key 存储模型详情
 */
const MOCK_MODEL_DATA: Record<string, ModelDetailResponse['data']> = {
  // =====================================================
  // CodeBin-V2 模型（10个）- 金融/税务/政务算术表达式模型
  // =====================================================

  // 1. 工商银行 - 个人信用评分卡模型
  'v2_credit_score_icbc': createModelDetail(
    'v2_credit_score_icbc',
    'ent_bank_001',
    '个人信用评分卡模型',
    'CodeBin-V2',
    '金融风控',
    '基于用户历史信用记录、还款行为、资产状况等多维度指标，计算个人综合信用评分（0-1000分）',
    'calculate_credit_score',
    '计算个人信用评分',
    [
      { fid: 'p1', name: 'age', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '年龄' },
      { fid: 'p2', name: 'income', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '年收入（万元）' },
      { fid: 'p3', name: 'debt_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '负债率' },
      { fid: 'p4', name: 'credit_history_months', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '信用历史月数' },
      { fid: 'p5', name: 'overdue_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '逾期次数' },
      { fid: 'p6', name: 'card_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '持有信用卡数量' }
    ],
    [
      { fid: 'r1', name: 'credit_score', dataType: 2, isRequired: 1, description: '信用评分（0-1000）' },
      { fid: 'r2', name: 'credit_level', dataType: 1, isRequired: 1, description: '信用等级（A/B/C/D/E）' },
      { fid: 'r3', name: 'risk_flag', dataType: 6, isRequired: 1, description: '高风险标识' }
    ],
    '2024-01-15 10:30:00'
  ),

  // 2. 蚂蚁金服 - 反欺诈风险评分模型
  'v2_antifraud_score': createModelDetail(
    'v2_antifraud_score',
    'ent_fintech_001',
    '反欺诈风险评分模型',
    'CodeBin-V2',
    '金融风控',
    '基于用户行为特征、设备指纹、交易模式等计算反欺诈风险评分',
    'calculate_fraud_risk',
    '计算反欺诈风险评分',
    [
      { fid: 'p1', name: 'device_age_days', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '设备使用天数' },
      { fid: 'p2', name: 'login_freq_7d', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '7天登录频次' },
      { fid: 'p3', name: 'ip_change_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: 'IP变更次数' },
      { fid: 'p4', name: 'trans_amount_24h', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '24小时交易金额' },
      { fid: 'p5', name: 'new_device_flag', dataSource: '数据输入', dataType: 6, isEncrypt: 1, description: '是否新设备' },
      { fid: 'p6', name: 'night_trans_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '夜间交易占比' }
    ],
    [
      { fid: 'r1', name: 'fraud_score', dataType: 2, isRequired: 1, description: '欺诈风险评分（0-100）' },
      { fid: 'r2', name: 'risk_level', dataType: 1, isRequired: 1, description: '风险等级（低/中/高）' },
      { fid: 'r3', name: 'block_flag', dataType: 6, isRequired: 1, description: '是否建议拦截' }
    ],
    '2024-02-20 14:20:00'
  ),

  // 3. 国家税务总局 - 纳税信用评级模型
  'v2_tax_credit_rating': createModelDetail(
    'v2_tax_credit_rating',
    'ent_tax_001',
    '纳税信用评级模型',
    'CodeBin-V2',
    '税务管理',
    '根据企业纳税记录、申报准确性、税务违规情况计算纳税信用等级',
    'calculate_tax_credit',
    '计算纳税信用等级',
    [
      { fid: 'p1', name: 'tax_years', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '纳税年限' },
      { fid: 'p2', name: 'declare_accuracy', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '申报准确率' },
      { fid: 'p3', name: 'late_declare_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '逾期申报次数' },
      { fid: 'p4', name: 'tax_arrears_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '欠税金额（万元）' },
      { fid: 'p5', name: 'penalty_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '处罚次数' },
      { fid: 'p6', name: 'annual_tax_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '年纳税额（万元）' }
    ],
    [
      { fid: 'r1', name: 'credit_score', dataType: 2, isRequired: 1, description: '纳税信用分（0-100）' },
      { fid: 'r2', name: 'credit_grade', dataType: 1, isRequired: 1, description: '信用等级（A/B/C/D/M）' },
      { fid: 'r3', name: 'incentive_flag', dataType: 6, isRequired: 0, description: '是否享受激励政策' }
    ],
    '2024-03-10 09:15:00'
  ),

  // 4. 航天信息股份 - 发票真伪核验模型
  'v2_invoice_verify': createModelDetail(
    'v2_invoice_verify',
    'ent_tax_002',
    '发票真伪核验模型',
    'CodeBin-V2',
    '税务管理',
    '基于发票编码规则、校验位算法验证发票真伪',
    'verify_invoice',
    '验证发票真伪',
    [
      { fid: 'p1', name: 'invoice_code', dataSource: '数据输入', dataType: 1, isEncrypt: 1, description: '发票代码' },
      { fid: 'p2', name: 'invoice_number', dataSource: '数据输入', dataType: 1, isEncrypt: 1, description: '发票号码' },
      { fid: 'p3', name: 'issue_date', dataSource: '数据输入', dataType: 7, isEncrypt: 0, description: '开票日期' },
      { fid: 'p4', name: 'amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '金额' },
      { fid: 'p5', name: 'tax_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '税额' },
      { fid: 'p6', name: 'check_code', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '校验码后6位' }
    ],
    [
      { fid: 'r1', name: 'verify_result', dataType: 6, isRequired: 1, description: '验证结果（true/false）' },
      { fid: 'r2', name: 'invoice_status', dataType: 1, isRequired: 1, description: '发票状态（有效/作废/红冲）' },
      { fid: 'r3', name: 'risk_hint', dataType: 1, isRequired: 0, description: '风险提示' }
    ],
    '2024-04-05 16:45:00'
  ),

  // 5. 民政部 - 社会救助资格评估模型
  'v2_social_aid_eligibility': createModelDetail(
    'v2_social_aid_eligibility',
    'ent_gov_001',
    '社会救助资格评估模型',
    'CodeBin-V2',
    '政务服务',
    '根据家庭收入、财产、人口等因素评估是否符合社会救助条件',
    'evaluate_aid_eligibility',
    '评估社会救助资格',
    [
      { fid: 'p1', name: 'family_size', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '家庭人口数' },
      { fid: 'p2', name: 'monthly_income', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '月总收入（元）' },
      { fid: 'p3', name: 'property_value', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '房产价值（万元）' },
      { fid: 'p4', name: 'vehicle_value', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '车辆价值（万元）' },
      { fid: 'p5', name: 'disabled_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '残疾人口数' },
      { fid: 'p6', name: 'student_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '在校学生数' }
    ],
    [
      { fid: 'r1', name: 'eligible_flag', dataType: 6, isRequired: 1, description: '是否符合救助条件' },
      { fid: 'r2', name: 'aid_level', dataType: 1, isRequired: 1, description: '救助等级（低保/低边/特困）' },
      { fid: 'r3', name: 'monthly_aid_amount', dataType: 5, isRequired: 1, description: '月救助金额（元）' }
    ],
    '2024-05-10 10:00:00'
  ),

  // 6. 人力资源社会保障部 - 社保补贴计算模型
  'v2_subsidy_calculation': createModelDetail(
    'v2_subsidy_calculation',
    'ent_gov_002',
    '社保补贴计算模型',
    'CodeBin-V2',
    '政务服务',
    '根据缴费基数、补贴比例、地区系数计算社保补贴金额',
    'calculate_subsidy',
    '计算社保补贴金额',
    [
      { fid: 'p1', name: 'base_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '缴费基数（元）' },
      { fid: 'p2', name: 'subsidy_ratio', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '补贴比例' },
      { fid: 'p3', name: 'region_factor', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '地区系数' },
      { fid: 'p4', name: 'months', dataSource: '数据输入', dataType: 2, isEncrypt: 0, description: '补贴月数' },
      { fid: 'p5', name: 'employment_status', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '就业状态' }
    ],
    [
      { fid: 'r1', name: 'monthly_subsidy', dataType: 5, isRequired: 1, description: '月补贴金额（元）' },
      { fid: 'r2', name: 'total_subsidy', dataType: 5, isRequired: 1, description: '总补贴金额（元）' },
      { fid: 'r3', name: 'effective_date', dataType: 7, isRequired: 0, description: '生效日期' }
    ],
    '2024-06-15 14:30:00'
  ),

  // 7. 微粒贷科技 - 小额贷款风险评分模型
  'v2_loan_risk_score': createModelDetail(
    'v2_loan_risk_score',
    'ent_microloan_001',
    '小额贷款风险评分模型',
    'CodeBin-V2',
    '金融风控',
    '基于借款人多维度数据计算贷款违约风险评分',
    'calculate_loan_risk',
    '计算贷款风险评分',
    [
      { fid: 'p1', name: 'loan_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '申请金额（元）' },
      { fid: 'p2', name: 'loan_term', dataSource: '数据输入', dataType: 2, isEncrypt: 0, description: '贷款期限（月）' },
      { fid: 'p3', name: 'income', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '月收入（元）' },
      { fid: 'p4', name: 'existing_debt', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '现有负债（元）' },
      { fid: 'p5', name: 'credit_score', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '信用评分' },
      { fid: 'p6', name: 'employment_years', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '工作年限' }
    ],
    [
      { fid: 'r1', name: 'risk_score', dataType: 2, isRequired: 1, description: '风险评分（0-100）' },
      { fid: 'r2', name: 'approve_flag', dataType: 6, isRequired: 1, description: '是否建议通过' },
      { fid: 'r3', name: 'suggest_rate', dataType: 5, isRequired: 1, description: '建议利率' }
    ],
    '2024-07-20 09:00:00'
  ),

  // 8. 国家税务总局 - 企业税务风险评估模型
  'v2_enterprise_tax_risk': createModelDetail(
    'v2_enterprise_tax_risk',
    'ent_tax_001',
    '企业税务风险评估模型',
    'CodeBin-V2',
    '税务管理',
    '根据企业财务指标、纳税行为、行业特征评估税务风险',
    'assess_tax_risk',
    '评估企业税务风险',
    [
      { fid: 'p1', name: 'profit_margin', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '利润率' },
      { fid: 'p2', name: 'tax_burden_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '税负率' },
      { fid: 'p3', name: 'revenue_growth', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '营收增长率' },
      { fid: 'p4', name: 'related_trans_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '关联交易占比' },
      { fid: 'p5', name: 'industry_avg_burden', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '行业平均税负' },
      { fid: 'p6', name: 'audit_history_count', dataSource: '数据输入', dataType: 2, isEncrypt: 0, description: '历史稽查次数' }
    ],
    [
      { fid: 'r1', name: 'risk_score', dataType: 2, isRequired: 1, description: '风险评分（0-100）' },
      { fid: 'r2', name: 'risk_level', dataType: 1, isRequired: 1, description: '风险等级（低/中/高）' },
      { fid: 'r3', name: 'focus_areas', dataType: 1, isRequired: 0, description: '重点关注领域（JSON）' }
    ],
    '2024-08-05 11:20:00'
  ),

  // 9. 住房和城乡建设部 - 公租房资格评分模型
  'v2_housing_qualified': createModelDetail(
    'v2_housing_qualified',
    'ent_gov_003',
    '公租房资格评分模型',
    'CodeBin-V2',
    '政务服务',
    '根据家庭住房、收入、户籍等情况评估公租房申请资格',
    'evaluate_housing_qualification',
    '评估公租房申请资格',
    [
      { fid: 'p1', name: 'family_size', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '家庭人口数' },
      { fid: 'p2', name: 'housing_area', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '人均住房面积（㎡）' },
      { fid: 'p3', name: 'monthly_income', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '家庭月收入（元）' },
      { fid: 'p4', name: 'residence_years', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '本地居住年限' },
      { fid: 'p5', name: 'social_security_years', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '社保缴纳年限' },
      { fid: 'p6', name: 'priority_flag', dataSource: '数据输入', dataType: 6, isEncrypt: 0, description: '是否优先保障对象' }
    ],
    [
      { fid: 'r1', name: 'qualified_flag', dataType: 6, isRequired: 1, description: '是否符合申请条件' },
      { fid: 'r2', name: 'priority_score', dataType: 2, isRequired: 1, description: '优先级评分（0-100）' },
      { fid: 'r3', name: 'suggest_area', dataType: 5, isRequired: 1, description: '建议配租面积（㎡）' }
    ],
    '2024-09-01 16:00:00'
  ),

  // 10. 中国人寿保险 - 保险理赔金额计算模型
  'v2_insurance_claim_calc': createModelDetail(
    'v2_insurance_claim_calc',
    'ent_insurance_001',
    '保险理赔金额计算模型',
    'CodeBin-V2',
    '保险服务',
    '根据保单条款、事故类型、损失程度计算理赔金额',
    'calculate_claim_amount',
    '计算理赔金额',
    [
      { fid: 'p1', name: 'policy_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '保额（元）' },
      { fid: 'p2', name: 'loss_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '损失程度' },
      { fid: 'p3', name: 'deductible', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '免赔额（元）' },
      { fid: 'p4', name: 'coinsurance_ratio', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '共付比例' },
      { fid: 'p5', name: 'accident_type', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '事故类型' },
      { fid: 'p6', name: 'policy_days', dataSource: '数据输入', dataType: 2, isEncrypt: 0, description: '保单已生效天数' }
    ],
    [
      { fid: 'r1', name: 'claim_amount', dataType: 5, isRequired: 1, description: '理赔金额（元）' },
      { fid: 'r2', name: 'deductible_applied', dataType: 5, isRequired: 1, description: '已扣免赔额（元）' },
      { fid: 'r3', name: 'claim_status', dataType: 1, isRequired: 1, description: '理赔状态' }
    ],
    '2024-10-10 13:30:00'
  ),

  // =====================================================
  // CodeBin-V3-1 模型（10个）- 金融/税务/政务算术表达式模型
  // =====================================================

  // 1. 建设银行 - 房贷审批评分模型
  'v31_mortgage_score': createModelDetail(
    'v31_mortgage_score',
    'ent_bank_002',
    '房贷审批评分模型',
    'CodeBin-V3-1',
    '金融风控',
    '根据申请人资信状况、还款能力、抵押物价值计算房贷审批评分',
    'calculate_mortgage_score',
    '计算房贷审批评分',
    [
      { fid: 'p1', name: 'loan_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '贷款金额（万元）' },
      { fid: 'p2', name: 'property_value', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '房产估值（万元）' },
      { fid: 'p3', name: 'monthly_income', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '月收入（元）' },
      { fid: 'p4', name: 'existing_debt', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '现有月负债（元）' },
      { fid: 'p5', name: 'credit_score', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '信用评分' },
      { fid: 'p6', name: 'down_payment_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 0, description: '首付比例' }
    ],
    [
      { fid: 'r1', name: 'approval_score', dataType: 2, isRequired: 1, description: '审批评分（0-100）' },
      { fid: 'r2', name: 'max_ltv', dataType: 5, isRequired: 1, description: '最高贷款成数' },
      { fid: 'r3', name: 'suggest_rate', dataType: 5, isRequired: 1, description: '建议利率' }
    ],
    '2024-01-20 10:00:00'
  ),

  // 2. 招商银行 - 信用卡额度测算模型
  'v31_card_limit_calc': createModelDetail(
    'v31_card_limit_calc',
    'ent_bank_003',
    '信用卡额度测算模型',
    'CodeBin-V3-1',
    '金融风控',
    '根据申请人综合资质测算信用卡授信额度',
    'calculate_card_limit',
    '测算信用卡额度',
    [
      { fid: 'p1', name: 'annual_income', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '年收入（万元）' },
      { fid: 'p2', name: 'assets_value', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '资产总值（万元）' },
      { fid: 'p3', name: 'credit_score', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '信用评分' },
      { fid: 'p4', name: 'employment_type', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '就业类型' },
      { fid: 'p5', name: 'existing_card_limit', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '现有信用卡总额度（万元）' },
      { fid: 'p6', name: 'card_usage_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '信用卡使用率' }
    ],
    [
      { fid: 'r1', name: 'suggest_limit', dataType: 5, isRequired: 1, description: '建议额度（万元）' },
      { fid: 'r2', name: 'min_limit', dataType: 5, isRequired: 1, description: '最低额度（万元）' },
      { fid: 'r3', name: 'max_limit', dataType: 5, isRequired: 1, description: '最高额度（万元）' }
    ],
    '2024-02-15 14:30:00'
  ),

  // 3. 京东数科 - 用户价值分层模型
  'v31_user_value_score': createModelDetail(
    'v31_user_value_score',
    'ent_fintech_002',
    '用户价值分层模型',
    'CodeBin-V3-1',
    '金融运营',
    '根据用户消费行为、活跃度、贡献度进行价值分层',
    'calculate_user_value',
    '计算用户价值评分',
    [
      { fid: 'p1', name: 'total_consumption', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '累计消费金额（元）' },
      { fid: 'p2', name: 'active_months', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '活跃月数' },
      { fid: 'p3', name: 'order_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '订单数量' },
      { fid: 'p4', name: 'avg_order_value', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '平均订单金额（元）' },
      { fid: 'p5', name: 'return_rate', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '退货率' },
      { fid: 'p6', name: 'referral_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '推荐新用户数' }
    ],
    [
      { fid: 'r1', name: 'value_score', dataType: 2, isRequired: 1, description: '价值评分（0-100）' },
      { fid: 'r2', name: 'tier', dataType: 1, isRequired: 1, description: '价值层级（S/A/B/C）' },
      { fid: 'r3', name: 'lifetime_value', dataType: 5, isRequired: 1, description: '预测终身价值（元）' }
    ],
    '2024-03-20 09:45:00'
  ),

  // 4. 医疗保障局 - 医保报销计算模型
  'v31_medical_reimburse': createModelDetail(
    'v31_medical_reimburse',
    'ent_gov_004',
    '医保报销计算模型',
    'CodeBin-V3-1',
    '政务服务',
    '根据医疗费用、医保类型、报销政策计算医保报销金额',
    'calculate_reimbursement',
    '计算医保报销金额',
    [
      { fid: 'p1', name: 'total_cost', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '医疗总费用（元）' },
      { fid: 'p2', name: 'insurance_type', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '医保类型（职工/居民）' },
      { fid: 'p3', name: 'hospital_level', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '医院等级（三甲/二甲/社区）' },
      { fid: 'p4', name: 'deductible', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '起付线（元）' },
      { fid: 'p5', name: 'reimburse_ratio', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '报销比例' },
      { fid: 'p6', name: 'cap_amount', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '封顶线（元）' }
    ],
    [
      { fid: 'r1', name: 'reimburse_amount', dataType: 5, isRequired: 1, description: '报销金额（元）' },
      { fid: 'r2', name: 'self_pay_amount', dataType: 5, isRequired: 1, description: '自付金额（元）' },
      { fid: 'r3', name: 'account_balance', dataType: 5, isRequired: 0, description: '账户余额（元）' }
    ],
    '2024-04-10 11:15:00'
  ),

  // 5. 人力资源社会保障部 - 养老金计算模型
  'v31_pension_calculation': createModelDetail(
    'v31_pension_calculation',
    'ent_gov_002',
    '养老金计算模型',
    'CodeBin-V3-1',
    '政务服务',
    '根据缴费年限、缴费基数、地区社平工资计算养老金',
    'calculate_pension',
    '计算养老金',
    [
      { fid: 'p1', name: 'contribution_years', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '缴费年限' },
      { fid: 'p2', name: 'avg_contribution_index', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '平均缴费指数' },
      { fid: 'p3', name: 'local_avg_salary', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '地区社平工资（元）' },
      { fid: 'p4', name: 'personal_account_balance', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '个人账户余额（元）' },
      { fid: 'p5', name: 'retire_age', dataSource: '数据输入', dataType: 2, isEncrypt: 0, description: '退休年龄' },
      { fid: 'p6', name: 'count_months', dataSource: '参数配置', dataType: 2, isEncrypt: 0, description: '计发月数' }
    ],
    [
      { fid: 'r1', name: 'monthly_pension', dataType: 5, isRequired: 1, description: '月养老金（元）' },
      { fid: 'r2', name: 'basic_pension', dataType: 5, isRequired: 1, description: '基础养老金（元）' },
      { fid: 'r3', name: 'personal_pension', dataType: 5, isRequired: 1, description: '个人账户养老金（元）' }
    ],
    '2024-05-25 15:30:00'
  ),

  // 6. 中国拍卖行业协会 - 拍卖保留价估算模型
  'v31_auction_reserve': createModelDetail(
    'v31_auction_reserve',
    'ent_auction_001',
    '拍卖保留价估算模型',
    'CodeBin-V3-1',
    '商业服务',
    '根据拍品类型、市场行情、历史成交价估算拍卖保留价',
    'estimate_reserve_price',
    '估算拍卖保留价',
    [
      { fid: 'p1', name: 'item_type', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '拍品类型' },
      { fid: 'p2', name: 'market_index', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '市场指数' },
      { fid: 'p3', name: 'historical_avg_price', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '历史平均成交价（万元）' },
      { fid: 'p4', name: 'condition_score', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '品相评分（0-100）' },
      { fid: 'p5', name: 'rarity_score', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '稀有度评分（0-100）' },
      { fid: 'p6', name: 'reserve_ratio', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '保留价折扣系数' }
    ],
    [
      { fid: 'r1', name: 'reserve_price', dataType: 5, isRequired: 1, description: '建议保留价（万元）' },
      { fid: 'r2', name: 'price_range_low', dataType: 5, isRequired: 1, description: '估价下限（万元）' },
      { fid: 'r3', name: 'price_range_high', dataType: 5, isRequired: 1, description: '估价上限（万元）' }
    ],
    '2024-06-12 10:45:00'
  ),

  // 7. 中国人寿保险 - 保费精算模型
  'v31_premium_calculation': createModelDetail(
    'v31_premium_calculation',
    'ent_insurance_001',
    '保费精算模型',
    'CodeBin-V3-1',
    '保险服务',
    '根据被保险人年龄、性别、保额、保障期限计算保费',
    'calculate_premium',
    '计算保险保费',
    [
      { fid: 'p1', name: 'age', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '被保险人年龄' },
      { fid: 'p2', name: 'gender', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '性别' },
      { fid: 'p3', name: 'coverage_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '保额（万元）' },
      { fid: 'p4', name: 'coverage_years', dataSource: '数据输入', dataType: 2, isEncrypt: 0, description: '保障期限（年）' },
      { fid: 'p5', name: 'payment_period', dataSource: '数据输入', dataType: 2, isEncrypt: 0, description: '缴费期限（年）' },
      { fid: 'p6', name: 'health_factor', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '健康系数' }
    ],
    [
      { fid: 'r1', name: 'annual_premium', dataType: 5, isRequired: 1, description: '年缴保费（元）' },
      { fid: 'r2', name: 'total_premium', dataType: 5, isRequired: 1, description: '总保费（元）' },
      { fid: 'r3', name: 'premium_rate', dataType: 5, isRequired: 1, description: '费率' }
    ],
    '2024-07-08 14:20:00'
  ),

  // 8. 工商银行 - 中小企业信用评分模型
  'v31_sme_credit_score': createModelDetail(
    'v31_sme_credit_score',
    'ent_bank_001',
    '中小企业信用评分模型',
    'CodeBin-V3-1',
    '金融风控',
    '根据企业财务指标、经营状况、行业风险计算信用评分',
    'calculate_sme_credit',
    '计算中小企业信用评分',
    [
      { fid: 'p1', name: 'revenue', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '年营收（万元）' },
      { fid: 'p2', name: 'net_profit', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '净利润（万元）' },
      { fid: 'p3', name: 'asset_liability_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '资产负债率' },
      { fid: 'p4', name: 'current_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '流动比率' },
      { fid: 'p5', name: 'operation_years', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '经营年限' },
      { fid: 'p6', name: 'industry_risk_factor', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '行业风险系数' }
    ],
    [
      { fid: 'r1', name: 'credit_score', dataType: 2, isRequired: 1, description: '信用评分（0-100）' },
      { fid: 'r2', name: 'credit_grade', dataType: 1, isRequired: 1, description: '信用等级（AAA/AA/A/BBB）' },
      { fid: 'r3', name: 'max_credit_line', dataType: 5, isRequired: 1, description: '建议授信额度（万元）' }
    ],
    '2024-08-18 09:30:00'
  ),

  // 9. 民政部 - 灾害救助金计算模型
  'v31_disaster_aid_calc': createModelDetail(
    'v31_disaster_aid_calc',
    'ent_gov_001',
    '灾害救助金计算模型',
    'CodeBin-V3-1',
    '政务服务',
    '根据灾害损失程度、受灾人口、地区标准计算救助金',
    'calculate_disaster_aid',
    '计算灾害救助金',
    [
      { fid: 'p1', name: 'disaster_level', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '灾害等级' },
      { fid: 'p2', name: 'affected_population', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '受灾人口数' },
      { fid: 'p3', name: 'housing_loss_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '房屋损失程度' },
      { fid: 'p4', name: 'crop_loss_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '农作物损失程度' },
      { fid: 'p5', name: 'base_standard', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '基准救助标准（元/人）' },
      { fid: 'p6', name: 'region_factor', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '地区调整系数' }
    ],
    [
      { fid: 'r1', name: 'total_aid_amount', dataType: 5, isRequired: 1, description: '总救助金额（万元）' },
      { fid: 'r2', name: 'per_capita_aid', dataType: 5, isRequired: 1, description: '人均救助金额（元）' },
      { fid: 'r3', name: 'housing_aid', dataType: 5, isRequired: 1, description: '住房救助金额（万元）' }
    ],
    '2024-09-22 16:15:00'
  ),

  // 10. 蚂蚁金服 - 营销响应评分模型
  'v31_marketing_response': createModelDetail(
    'v31_marketing_response',
    'ent_fintech_001',
    '营销响应评分模型',
    'CodeBin-V3-1',
    '金融运营',
    '根据用户历史行为、消费偏好预测营销活动响应概率',
    'predict_response_score',
    '预测营销响应评分',
    [
      { fid: 'p1', name: 'historical_response_rate', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '历史响应率' },
      { fid: 'p2', name: 'active_days_30d', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '30天活跃天数' },
      { fid: 'p3', name: 'avg_transaction_90d', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '90天平均交易额（元）' },
      { fid: 'p4', name: 'coupon_usage_rate', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '优惠券使用率' },
      { fid: 'p5', name: 'app_open_freq', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: 'APP打开频次' },
      { fid: 'p6', name: 'campaign_type', dataSource: '参数配置', dataType: 1, isEncrypt: 0, description: '活动类型' }
    ],
    [
      { fid: 'r1', name: 'response_score', dataType: 2, isRequired: 1, description: '响应评分（0-100）' },
      { fid: 'r2', name: 'response_probability', dataType: 5, isRequired: 1, description: '响应概率' },
      { fid: 'r3', name: 'priority_level', dataType: 1, isRequired: 1, description: '推送优先级（高/中/低）' }
    ],
    '2024-10-05 11:00:00'
  ),

  // =====================================================
  // CodeBin-V3-2 模型（10个）- 金融/税务/政务算术表达式模型
  // =====================================================

  // 1. 招商银行 - 车贷审批评分模型
  'v32_car_loan_score': createModelDetail(
    'v32_car_loan_score',
    'ent_bank_003',
    '车贷审批评分模型',
    'CodeBin-V3-2',
    '金融风控',
    '根据申请人资质、车辆信息、贷款方案计算车贷审批评分',
    'calculate_car_loan_score',
    '计算车贷审批评分',
    [
      { fid: 'p1', name: 'loan_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '贷款金额（万元）' },
      { fid: 'p2', name: 'car_value', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '车辆估值（万元）' },
      { fid: 'p3', name: 'car_age', dataSource: '数据输入', dataType: 2, isEncrypt: 0, description: '车龄（年）' },
      { fid: 'p4', name: 'monthly_income', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '月收入（元）' },
      { fid: 'p5', name: 'down_payment_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 0, description: '首付比例' },
      { fid: 'p6', name: 'credit_score', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '信用评分' }
    ],
    [
      { fid: 'r1', name: 'approval_score', dataType: 2, isRequired: 1, description: '审批评分（0-100）' },
      { fid: 'r2', name: 'max_ltv', dataType: 5, isRequired: 1, description: '最高贷款成数' },
      { fid: 'r3', name: 'suggest_term', dataType: 2, isRequired: 1, description: '建议贷款期限（月）' }
    ],
    '2024-01-25 10:30:00'
  ),

  // 2. 建设银行 - 逾期风险预警模型
  'v32_overdue_risk_score': createModelDetail(
    'v32_overdue_risk_score',
    'ent_bank_002',
    '逾期风险预警模型',
    'CodeBin-V3-2',
    '金融风控',
    '根据借款人还款行为、财务变化预测逾期风险',
    'predict_overdue_risk',
    '预测逾期风险评分',
    [
      { fid: 'p1', name: 'remaining_principal', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '剩余本金（万元）' },
      { fid: 'p2', name: 'overdue_days', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '当前逾期天数' },
      { fid: 'p3', name: 'payment_to_income_ratio', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '还款收入比' },
      { fid: 'p4', name: 'credit_score_change', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '信用分变化' },
      { fid: 'p5', name: 'employment_stability', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '就业稳定性评分' },
      { fid: 'p6', name: 'historical_overdue_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '历史逾期次数' }
    ],
    [
      { fid: 'r1', name: 'risk_score', dataType: 2, isRequired: 1, description: '风险评分（0-100）' },
      { fid: 'r2', name: 'risk_level', dataType: 1, isRequired: 1, description: '风险等级（低/中/高/极高）' },
      { fid: 'r3', name: 'action_suggestion', dataType: 1, isRequired: 1, description: '处置建议' }
    ],
    '2024-02-28 14:45:00'
  ),

  // 3. 京东数科 - 客户流失风险评分模型
  'v32_churn_prediction_score': createModelDetail(
    'v32_churn_prediction_score',
    'ent_fintech_002',
    '客户流失风险评分模型',
    'CodeBin-V3-2',
    '金融运营',
    '根据客户活跃度、交易频次、服务使用情况预测流失风险',
    'predict_churn_risk',
    '预测客户流失风险',
    [
      { fid: 'p1', name: 'inactive_days', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '未活跃天数' },
      { fid: 'p2', name: 'transaction_decline_rate', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '交易下降率' },
      { fid: 'p3', name: 'service_complaint_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '服务投诉次数' },
      { fid: 'p4', name: 'competitor_usage_flag', dataSource: '数据输入', dataType: 6, isEncrypt: 1, description: '是否使用竞品' },
      { fid: 'p5', name: 'membership_years', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '会员年限' },
      { fid: 'p6', name: 'last_contact_days', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '上次联系天数' }
    ],
    [
      { fid: 'r1', name: 'churn_score', dataType: 2, isRequired: 1, description: '流失风险评分（0-100）' },
      { fid: 'r2', name: 'churn_probability', dataType: 5, isRequired: 1, description: '流失概率' },
      { fid: 'r3', name: 'retention_priority', dataType: 1, isRequired: 1, description: '挽留优先级（高/中/低）' }
    ],
    '2024-03-15 09:20:00'
  ),

  // 4. 住房和城乡建设部 - 房产税计算模型
  'v32_property_tax_calc': createModelDetail(
    'v32_property_tax_calc',
    'ent_gov_003',
    '房产税计算模型',
    'CodeBin-V3-2',
    '政务服务',
    '根据房产价值、面积、用途计算应缴房产税',
    'calculate_property_tax',
    '计算房产税',
    [
      { fid: 'p1', name: 'property_value', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '房产评估值（万元）' },
      { fid: 'p2', name: 'property_area', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '房产面积（㎡）' },
      { fid: 'p3', name: 'property_type', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '房产类型（住宅/商业/办公）' },
      { fid: 'p4', name: 'tax_rate', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '税率' },
      { fid: 'p5', name: 'deduction_area', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '免税面积（㎡）' },
      { fid: 'p6', name: 'holding_years', dataSource: '数据输入', dataType: 2, isEncrypt: 0, description: '持有年限' }
    ],
    [
      { fid: 'r1', name: 'annual_tax', dataType: 5, isRequired: 1, description: '年应缴税额（元）' },
      { fid: 'r2', name: 'taxable_value', dataType: 5, isRequired: 1, description: '计税价值（万元）' },
      { fid: 'r3', name: 'deduction_amount', dataType: 5, isRequired: 1, description: '减免金额（元）' }
    ],
    '2024-04-20 11:30:00'
  ),

  // 5. 医疗保障局 - 医疗救助资格评估模型
  'v32_medical_assistance': createModelDetail(
    'v32_medical_assistance',
    'ent_gov_004',
    '医疗救助资格评估模型',
    'CodeBin-V3-2',
    '政务服务',
    '根据家庭经济状况、医疗支出评估医疗救助资格和金额',
    'evaluate_medical_assistance',
    '评估医疗救助资格',
    [
      { fid: 'p1', name: 'annual_medical_expense', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '年度医疗支出（元）' },
      { fid: 'p2', name: 'family_income', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '家庭年收入（元）' },
      { fid: 'p3', name: 'disease_type', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '疾病类型（重特大/慢性/普通）' },
      { fid: 'p4', name: 'insurance_reimburse', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '医保已报销金额（元）' },
      { fid: 'p5', name: 'poverty_line', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '贫困线标准（元）' },
      { fid: 'p6', name: 'assistance_ratio', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '救助比例' }
    ],
    [
      { fid: 'r1', name: 'eligible_flag', dataType: 6, isRequired: 1, description: '是否符合救助条件' },
      { fid: 'r2', name: 'assistance_amount', dataType: 5, isRequired: 1, description: '救助金额（元）' },
      { fid: 'r3', name: 'assistance_type', dataType: 1, isRequired: 1, description: '救助类型' }
    ],
    '2024-05-12 15:00:00'
  ),

  // 6. 中国人寿保险 - 理赔欺诈风险评分模型
  'v32_claim_fraud_detect': createModelDetail(
    'v32_claim_fraud_detect',
    'ent_insurance_001',
    '理赔欺诈风险评分模型',
    'CodeBin-V3-2',
    '保险服务',
    '根据理赔申请特征、历史数据评估欺诈风险',
    'detect_claim_fraud',
    '检测理赔欺诈风险',
    [
      { fid: 'p1', name: 'claim_interval_days', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '距投保天数' },
      { fid: 'p2', name: 'claim_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '理赔金额（元）' },
      { fid: 'p3', name: 'claim_count_12m', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '12个月理赔次数' },
      { fid: 'p4', name: 'document_consistency_score', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '材料一致性评分' },
      { fid: 'p5', name: 'hospital_level', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '就诊医院等级' },
      { fid: 'p6', name: 'beneficiary_relation', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '受益人关系' }
    ],
    [
      { fid: 'r1', name: 'fraud_score', dataType: 2, isRequired: 1, description: '欺诈风险评分（0-100）' },
      { fid: 'r2', name: 'risk_level', dataType: 1, isRequired: 1, description: '风险等级（低/中/高）' },
      { fid: 'r3', name: 'investigation_flag', dataType: 6, isRequired: 1, description: '是否需要调查' }
    ],
    '2024-06-08 10:15:00'
  ),

  // 7. 工商银行 - 负债率计算模型
  'v32_debt_ratio_calc': createModelDetail(
    'v32_debt_ratio_calc',
    'ent_bank_001',
    '负债率计算模型',
    'CodeBin-V3-2',
    '金融风控',
    '综合计算个人或企业负债率及偿债能力',
    'calculate_debt_ratio',
    '计算负债率',
    [
      { fid: 'p1', name: 'total_debt', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '总负债（万元）' },
      { fid: 'p2', name: 'total_assets', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '总资产（万元）' },
      { fid: 'p3', name: 'annual_income', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '年收入（万元）' },
      { fid: 'p4', name: 'monthly_payment', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '月还款额（元）' },
      { fid: 'p5', name: 'liquid_assets', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '流动资产（万元）' },
      { fid: 'p6', name: 'short_term_debt', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '短期负债（万元）' }
    ],
    [
      { fid: 'r1', name: 'debt_ratio', dataType: 5, isRequired: 1, description: '负债率' },
      { fid: 'r2', name: 'debt_to_income_ratio', dataType: 5, isRequired: 1, description: '债务收入比' },
      { fid: 'r3', name: 'liquidity_ratio', dataType: 5, isRequired: 1, description: '流动比率' }
    ],
    '2024-07-25 14:30:00'
  ),

  // 8. 国家税务总局 - 增值税退税计算模型
  'v32_vat_refund_calc': createModelDetail(
    'v32_vat_refund_calc',
    'ent_tax_001',
    '增值税退税计算模型',
    'CodeBin-V3-2',
    '税务管理',
    '根据出口销售额、进项税额、退税率计算增值税退税额',
    'calculate_vat_refund',
    '计算增值税退税额',
    [
      { fid: 'p1', name: 'export_sales', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '出口销售额（万元）' },
      { fid: 'p2', name: 'input_vat', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '进项税额（万元）' },
      { fid: 'p3', name: 'output_vat', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '销项税额（万元）' },
      { fid: 'p4', name: 'refund_rate', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '退税率' },
      { fid: 'p5', name: 'product_type', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '产品类型' },
      { fid: 'p6', name: 'prior_period_balance', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '上期留抵税额（万元）' }
    ],
    [
      { fid: 'r1', name: 'refund_amount', dataType: 5, isRequired: 1, description: '退税金额（万元）' },
      { fid: 'r2', name: 'exempt_amount', dataType: 5, isRequired: 1, description: '免抵税额（万元）' },
      { fid: 'r3', name: 'carryforward_balance', dataType: 5, isRequired: 1, description: '结转下期留抵（万元）' }
    ],
    '2024-08-12 09:45:00'
  ),

  // 9. 人力资源社会保障部 - 失业金计算模型
  'v32_unemployment_calc': createModelDetail(
    'v32_unemployment_calc',
    'ent_gov_002',
    '失业金计算模型',
    'CodeBin-V3-2',
    '政务服务',
    '根据缴费年限、工资水平、地区标准计算失业金',
    'calculate_unemployment_benefit',
    '计算失业金',
    [
      { fid: 'p1', name: 'contribution_years', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '缴费年限' },
      { fid: 'p2', name: 'avg_salary_12m', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '12个月平均工资（元）' },
      { fid: 'p3', name: 'local_min_wage', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '地区最低工资（元）' },
      { fid: 'p4', name: 'benefit_ratio', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '发放比例' },
      { fid: 'p5', name: 'terminate_reason', dataSource: '数据输入', dataType: 1, isEncrypt: 0, description: '离职原因' },
      { fid: 'p6', name: 'local_max_benefit', dataSource: '参数配置', dataType: 5, isEncrypt: 0, description: '地区最高发放标准（元）' }
    ],
    [
      { fid: 'r1', name: 'monthly_benefit', dataType: 5, isRequired: 1, description: '月失业金（元）' },
      { fid: 'r2', name: 'benefit_months', dataType: 2, isRequired: 1, description: '领取月数' },
      { fid: 'r3', name: 'total_benefit', dataType: 5, isRequired: 1, description: '总领取金额（元）' }
    ],
    '2024-09-18 11:00:00'
  ),

  // 10. 微粒贷科技 - 催收优先级评分模型
  'v32_collection_priority': createModelDetail(
    'v32_collection_priority',
    'ent_microloan_001',
    '催收优先级评分模型',
    'CodeBin-V3-2',
    '金融风控',
    '根据逾期金额、还款意愿、资产状况评估催收优先级',
    'calculate_collection_priority',
    '计算催收优先级',
    [
      { fid: 'p1', name: 'overdue_amount', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '逾期金额（元）' },
      { fid: 'p2', name: 'overdue_days', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '逾期天数' },
      { fid: 'p3', name: 'contact_success_rate', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '联系成功率' },
      { fid: 'p4', name: 'promise_payment_count', dataSource: '数据输入', dataType: 2, isEncrypt: 1, description: '承诺还款次数' },
      { fid: 'p5', name: 'asset_value', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '资产估值（万元）' },
      { fid: 'p6', name: 'historical_collection_cost', dataSource: '数据输入', dataType: 5, isEncrypt: 1, description: '历史催收成本（元）' }
    ],
    [
      { fid: 'r1', name: 'priority_score', dataType: 2, isRequired: 1, description: '优先级评分（0-100）' },
      { fid: 'r2', name: 'priority_level', dataType: 1, isRequired: 1, description: '优先级（高/中/低）' },
      { fid: 'r3', name: 'suggest_strategy', dataType: 1, isRequired: 1, description: '建议策略（电话/上门/法律）' }
    ],
    '2024-10-22 16:30:00'
  ),

  // =====================================================
  // SPDZ 模型
  // =====================================================
  'spdz_001': createModelDetail(
    'spdz_001',
    'ent_003',
    'SPDZ计算模型',
    'SPDZ',
    '通用计算',
    '基于SPDZ协议的安全多方计算模型，支持通用安全计算',
    'spdz_compute',
    'SPDZ安全计算',
    [],
    [
      { fid: 'r1', name: 'compute_result', dataType: 5, isRequired: 1, description: '计算结果' },
      { fid: 'r2', name: 'compute_time', dataType: 3, isRequired: 0, description: '计算耗时（毫秒）' }
    ],
    '2024-01-01 00:00:00'
  )
}

/**
 * 表达式模型的默认返回参数
 * 表达式模型只有一个默认输出，类型是浮点型
 */
export const EXPRESSION_MODEL_OUTPUT: ModelReturnParameter = {
  fid: 'expr_output_001',
  name: 'result',
  dataType: ModelDataType.FLOAT,
  isRequired: 1,
  description: '表达式计算结果'
}

/**
 * 获取模型详情（Mock 接口）
 * @param modelId 模型ID
 * @returns Promise<ModelDetailResponse>
 */
export async function getModelDetail(modelId: string): Promise<ModelDetailResponse> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100))

  const modelData = MOCK_MODEL_DATA[modelId]

  if (modelData) {
    return {
      code: 200,
      msg: 'success',
      data: modelData
    }
  }

  // 如果找不到模型，返回错误
  return {
    code: 404,
    msg: 'Model not found',
    data: {} as any
  }
}

/**
 * 获取数据类型名称
 * @param dataType 数据类型编号
 * @returns 数据类型名称
 */
export function getDataTypeName(dataType: number): string {
  return DATA_TYPE_NAMES[dataType] || 'UNKNOWN'
}

/**
 * 为模型选择器提供 Mock 模型列表
 * 从 MOCK_MODEL_DATA 中提取所有模型
 */
export const MOCK_MODELS = Object.entries(MOCK_MODEL_DATA).map(([id, data]) => ({
  id,
  name: data.name,
  type: data.type,
  participantId: data.partyId
}))

/**
 * 获取模型输入参数签名
 * @param modelId 模型ID
 * @returns Promise<ModelParameterSignature[]>
 */
export async function getModelInputSignatures(modelId: string): Promise<Array<{
  fid: string
  name: string
  dataSource: string
  dataType: number
  isEncrypt: number
  description: string
}>> {
  const response = await getModelDetail(modelId)
  if (response.code !== 200) {
    throw new Error(response.msg)
  }
  return response.data.modelParameters
}

# PR审查检查清单: 联邦学习任务重构

**Purpose**: PR审查阶段的需求质量验证，确保规格文档完整性、清晰性、一致性
**Created**: 2026-03-27
**Feature**: [spec.md](../spec.md)
**Depth**: PR审查（中等深度）
**Focus**: 参数完整性、执行类型约束、连接规则、用户流程、非功能需求

---

## 参数完整性

### 预处理任务参数

- [ ] CHK001 数据清洗5种子类型的参数是否全部定义了数据类型、默认值、范围？[完整性, Spec §FR-002.1, Appendix A.1]
- [ ] CHK002 数据采样5种子类型的参数是否全部定义了数据类型、默认值、范围？[完整性, Spec §FR-002.2, Appendix A.2]
- [ ] CHK003 缺失值处理的`strategy`参数是否明确定义了`constant`策略与`fillValue`参数的依赖关系？[一致性, Spec §A.1]
- [ ] CHK004 异常值处理的`method`参数是否明确定义了`zscore`方法与`threshold`参数的依赖关系？[一致性, Spec §A.1]
- [ ] CHK005 类型转换的`format`参数是否明确定义了仅当`targetType=datetime`时生效？[一致性, Spec §A.1]

### 特征工程任务参数

- [ ] CHK006 特征分箱2种子类型的参数是否全部定义？是否明确了`labelColumn`为计算WOE/IV必需？[完整性, Spec §FR-003.1, Appendix B.1]
- [ ] CHK007 特征编码2种子类型的参数是否全部定义？`handleUnknown`的`ignore`行为是否明确？[完整性, Spec §FR-003.2, Appendix B.2]
- [ ] CHK008 特征变换2种子类型的参数是否全部定义？`offset`参数避免`log(0)`的说明是否清晰？[完整性, Spec §FR-003.3, Appendix B.3]
- [ ] CHK009 特征选择3种子类型的参数是否全部定义？IV值计算的前提条件是否明确？[完整性, Spec §FR-003.4, Appendix B.4]
- [ ] CHK010 特征缩放2种子类型的参数是否全部定义？[完整性, Spec §FR-003.5, Appendix B.5]
- [ ] CHK011 特征相关性分析2种子类型的参数是否全部定义？[完整性, Spec §FR-003.6, Appendix B.6]

### 横向模型参数

- [ ] CHK012 横向逻辑回归的7个参数是否全部定义了数据类型、默认值、范围？[完整性, Spec §FR-004.1, Appendix C.1]
- [ ] CHK013 横向神经网络的7个参数是否全部定义？`hiddenLayers`的数组格式是否明确？[完整性, Spec §Appendix C.2]
- [ ] CHK014 横向XGBoost的8个参数是否全部定义？[完整性, Spec §Appendix C.3]
- [ ] CHK015 横向KMeans的5个参数是否全部定义？[完整性, Spec §Appendix C.4]
- [ ] CHK016 横向KNN的5个参数是否全部定义？`p`参数的范围`1-∞`是否可测试？[完整性/可测量性, Spec §Appendix C.5]

### 纵向模型参数

- [ ] CHK017 纵向逻辑回归(SS-LR)的5个参数是否全部定义？`encryptionMethod`的可选值是否完整？[完整性, Spec §FR-005.1, Appendix D.1]
- [ ] CHK018 纵向线性回归的5个参数是否全部定义？[完整性, Spec §Appendix D.2]
- [ ] CHK019 纵向神经网络的6个参数是否全部定义？`splitPoint`的含义是否清晰？[完整性/清晰性, Spec §Appendix D.3]
- [ ] CHK020 纵向XGBoost(SecureBoost)的6个参数是否全部定义？[完整性, Spec §Appendix D.4]
- [ ] CHK021 纵向DeepFM的6个参数是否全部定义？[完整性, Spec §Appendix D.5]
- [ ] CHK022 纵向KMeans的4个参数是否全部定义？[完整性, Spec §Appendix D.6]
- [ ] CHK023 纵向朴素贝叶斯的3个参数是否全部定义？`classPrior`为空时的行为是否明确？[完整性/清晰性, Spec §Appendix D.7]

---

## 执行类型约束

- [ ] CHK024 三种执行类型(LOCAL/DYNAMIC/MULTI_PARTY)的定义是否足够清晰？[清晰性, Spec §FR-006.1]
- [ ] CHK025 单方本地任务"只能连接1个数据源"的约束是否在所有相关任务中一致定义？[一致性, Spec §FR-006.2, FR-002.3, FR-003.7]
- [ ] CHK026 多方隐私任务"必须连接2+数据源"的约束是否在所有相关任务中一致定义？[一致性, Spec §FR-006.3, FR-004.2, FR-005.2]
- [ ] CHK027 动态任务"根据连接数量自动判定"的判定规则是否明确？单连接=LOCAL，多连接=MULTI_PARTY？[清晰性, Spec §FR-006.4]
- [ ] CHK028 动态任务支持的JoinType(INNER)是否明确限定？其他JoinType是否被排除？[完整性, Spec §Assumptions]
- [ ] CHK029 data-model.md中的`FL_EXECUTION_TYPE_CONSTRAINTS`是否与spec.md一致？[一致性, data-model.md §2]

---

## 连接规则

- [ ] CHK030 连接约束违反时的Toast提示内容是否定义？[完整性, Spec §Edge Cases]
- [ ] CHK031 动态任务从单连接变为多连接时，UI更新"添加输出"按钮的时机是否明确？[清晰性, Spec §US5-AC3]
- [ ] CHK032 动态任务从多连接变为单连接时，"自动清除输出配置并提示用户"的提示内容是否定义？[完整性, Spec §Edge Cases]
- [ ] CHK033 单方本地任务尝试连接第二个数据源时的阻止机制是否明确？[完整性, Spec §FR-006.2]
- [ ] CHK034 多方隐私任务只连接1个数据源时的错误提示是否定义？[完整性, Spec §US3-AC3]

---

## 用户流程验收标准

### US1 数据清洗任务配置

- [ ] CHK035 US1-AC1 "任务节点正确创建并显示配置弹窗" - "正确"是否可客观验证？[可测量性, Spec §US1-AC1]
- [ ] CHK036 US1-AC2 "显示缺失值处理相关参数" - 参数列表是否完整定义？[完整性, Spec §US1-AC2, Appendix A.1]
- [ ] CHK037 US1-AC4 "输出schema与输入相同" - schema一致性的验证标准是否定义？[清晰性, Spec §US1-AC4]

### US2 特征分箱任务配置

- [ ] CHK038 US2-AC3/AC4 动态任务的单/多方模式切换条件是否明确？[清晰性, Spec §US2-AC3, US2-AC4]

### US3 横向逻辑回归模型训练

- [ ] CHK039 US3-AC3 "显示连接约束错误提示" - 提示的触发条件和内容是否明确？[完整性, Spec §US3-AC3]

### US4 纵向SecureBoost模型训练

- [ ] CHK040 US4-AC2 "安全方法为同态加密" - `secureMethod=he`是否与Appendix D.4一致？[一致性, Spec §US4-AC2, Appendix D.4]

### US5 动态任务类型切换

- [ ] CHK041 US5-AC3 "UI动态更新显示'添加输出'按钮" - 更新的时机（立即/延迟）是否定义？[清晰性, Spec §US5-AC3]

---

## 边缘情况覆盖

- [ ] CHK042 "子类型选择后不可变更"的约束是否在spec中明确说明？[完整性, Spec §Edge Cases]
- [ ] CHK043 "训练/推断模式在创建时确定"的约束是否在spec中明确说明？[完整性, Spec §Edge Cases]
- [ ] CHK044 参数验证失败的"实时内联提示"格式和位置是否定义？[完整性, Spec §Error Handling]
- [ ] CHK045 子类型下拉选择器的默认选中项是否定义？[完整性, Gap]
- [ ] CHK046 所有参数的必填/可选状态是否明确定义？[完整性, Spec §Appendix]

---

## 非功能需求可测量性

- [ ] CHK047 SC-001 "30秒内找到并拖拽任务" - 如何测量？是否有用户测试计划？[可测量性, Spec §SC-001]
- [ ] CHK048 SC-002 "2分钟内完成参数配置" - 如何测量？是否有用户测试计划？[可测量性, Spec §SC-002]
- [ ] CHK049 SC-003 "100%的任务都有完整的参数定义" - "完整"的标准是否明确？[清晰性, Spec §SC-003]
- [ ] CHK050 SC-004/005/006 "100%生效/正确执行" - 测试方法是否定义？[可测量性, Spec §SC-004, SC-005, SC-006]
- [ ] CHK051 SC-007 "95%用户首次使用" - 已标注为上线后调研指标，是否需要开发阶段验证方法？[可测量性, Spec §SC-007]
- [ ] CHK052 SC-008 "参数验证准确率100%" - 如何定义"准确"？边界情况是否覆盖？[清晰性, Spec §SC-008]

---

## 依赖与假设

- [ ] CHK053 "动态任务使用现有JoinType系统"的假设是否与现有代码一致？[一致性, Spec §Assumptions]
- [ ] CHK054 "参数定义基于FATE、PySyft等框架" - 是否有参考文档链接？[可追溯性, Spec §Assumptions]
- [ ] CHK055 "复用现有OutputConfig.vue组件" - 组件是否支持新的输出方选择需求？[完整性, Spec §Assumptions]
- [ ] CHK056 GET /api/fl/models API的Mock实现是否在plan中定义？[完整性, Spec §External Dependencies, contracts/fl-task-api.md]

---

## 术语一致性

- [ ] CHK057 "执行类型"与"任务类型"术语是否在所有文档中一致使用？[一致性, spec.md, plan.md, tasks.md]
- [ ] CHK058 "子类型"与"subtype"术语是否一致？[一致性, Gap]
- [ ] CHK059 "单方本地任务"与"LOCAL任务"是否可互换使用？是否需要统一？[一致性, Gap]

---

## 总结

| 类别 | 项目数 |
|------|--------|
| 参数完整性 | 23 |
| 执行类型约束 | 6 |
| 连接规则 | 5 |
| 用户流程验收标准 | 7 |
| 边缘情况覆盖 | 5 |
| 非功能需求可测量性 | 6 |
| 依赖与假设 | 4 |
| 术语一致性 | 3 |
| **总计** | **59** |

---

## 使用说明

1. 审查PR时，逐项检查上述清单
2. 通过的项目标记为 `[x]`
3. 发现问题时，在项目后添加注释说明
4. 所有CRITICAL问题必须在合并前解决
5. MEDIUM问题建议解决，可记录为后续改进项

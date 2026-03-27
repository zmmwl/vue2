# Feature Specification: 联邦学习任务重构

**Feature Branch**: `006-fl-task-restructure`
**Created**: 2026-03-26
**Status**: Draft
**Input**: 重构联邦学习任务菜单结构，支持预处理、特征工程、横向模型、纵向模型四类任务的完整参数配置，并实现单方本地任务、动态任务、多方隐私任务三种执行类型的输入输出规则。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 数据清洗任务配置 (Priority: P1)

作为数据分析人员，我需要配置数据清洗任务来处理缺失值、异常值等问题，以便后续的特征工程和模型训练能够使用高质量数据。

**Why this priority**: 数据清洗是所有联邦学习流程的基础，是使用频率最高的预处理任务。

**Independent Test**: 可通过拖拽数据清洗任务到画布、配置缺失值处理参数、连接数据源并验证任务配置来独立测试。

**Acceptance Scenarios**:

1. **Given** 用户已打开流程编辑器，**When** 从联邦学习预处理菜单拖拽数据清洗任务到画布，**Then** 任务节点正确创建并显示配置弹窗
2. **Given** 任务配置弹窗已打开，**When** 选择"缺失值处理"子类型，**Then** 显示缺失值处理相关参数（删除/均值填充/中位数填充/常数填充）
3. **Given** 用户选择了"常数填充"策略，**When** 填写填充值，**Then** 参数值正确保存
4. **Given** 数据清洗任务只连接了1个数据源，**When** 任务执行，**Then** 任务按单方本地模式执行，输出schema与输入相同

---

### User Story 2 - 特征分箱任务配置 (Priority: P1)

作为机器学习工程师，我需要配置特征分箱任务将连续特征离散化，并输出WOE/IV值用于特征评估。

**Why this priority**: 特征分箱是金融风控等场景的核心特征工程任务，WOE/IV是关键评估指标。

**Independent Test**: 可通过拖拽特征分箱任务、选择等频/等宽分箱、配置分箱数量、验证WOE/IV输出参数来独立测试。

**Acceptance Scenarios**:

1. **Given** 用户从特征工程菜单拖拽特征分箱任务，**When** 任务放置到画布，**Then** 显示任务配置弹窗
2. **Given** 配置弹窗已打开，**When** 选择"等频分箱(输出WOE/IV)"子类型，**Then** 显示分箱数量、是否输出WOE/IV等参数
3. **Given** 特征分箱任务连接了2个数据源（INNER连接），**When** 任务配置完成，**Then** 任务按多方隐私模式执行，显示"添加输出"按钮
4. **Given** 特征分箱任务只连接了1个数据源，**When** 任务配置完成，**Then** 任务按单方本地模式执行，隐藏"添加输出"按钮

---

### User Story 3 - 横向逻辑回归模型训练 (Priority: P1)

作为联邦学习参与者，我需要配置横向联邦逻辑回归模型进行联合训练，以便在不泄露本地数据的情况下获得更强大的模型。

**Why this priority**: 横向逻辑回归是最基础的联邦学习模型，使用广泛。

**Independent Test**: 可通过拖拽横向逻辑回归任务、配置学习率和迭代次数、选择模型输出方来独立测试。

**Acceptance Scenarios**:

1. **Given** 用户从横向模型菜单拖拽横向逻辑回归任务，**When** 任务放置到画布，**Then** 显示任务配置弹窗
2. **Given** 配置弹窗已打开，**When** 用户设置学习率为0.01、迭代次数为100，**Then** 参数正确保存
3. **Given** 横向逻辑回归任务必须连接2+数据源，**When** 用户尝试只连接1个数据源，**Then** 显示连接约束错误提示
4. **Given** 训练任务配置完成，**When** 用户点击"添加输出"，**Then** 显示模型输出方选择界面

---

### User Story 4 - 纵向SecureBoost模型训练 (Priority: P2)

作为联邦学习参与者，我需要配置纵向联邦SecureBoost（联邦XGBoost）模型进行联合训练。

**Why this priority**: SecureBoost是纵向联邦最常用的树模型，在金融风控中应用广泛。

**Independent Test**: 可通过拖拽纵向XGBoost任务、配置树数量和最大深度、选择安全方法来独立测试。

**Acceptance Scenarios**:

1. **Given** 用户从纵向模型菜单拖拽纵向XGBoost任务，**When** 任务放置到画布，**Then** 显示任务配置弹窗
2. **Given** 配置弹窗已打开，**When** 用户配置树数量为100、最大深度为6、安全方法为同态加密，**Then** 参数正确保存
3. **Given** 纵向XGBoost任务连接了多个数据源，**When** 任务配置完成，**Then** 显示"添加输出"按钮用于选择模型输出方

---

### User Story 5 - 动态任务类型切换 (Priority: P2)

作为流程设计者，我需要看到动态任务（如数据采样）根据连接数量自动切换为单方本地或多方隐私模式。

**Why this priority**: 动态任务类型是区分本地和联邦操作的关键逻辑。

**Independent Test**: 可通过创建数据采样任务、分别测试单连接和多连接场景来独立测试。

**Acceptance Scenarios**:

1. **Given** 数据采样任务只连接了1个数据源，**When** 系统判断任务类型，**Then** 任务按单方本地模式执行
2. **Given** 数据采样任务连接了2+数据源（INNER连接），**When** 系统判断任务类型，**Then** 任务按多方隐私模式执行
3. **Given** 动态任务从单连接变为多连接，**When** 连接变化，**Then** UI动态更新显示"添加输出"按钮

---

### Edge Cases

- **连接数从多变少**：自动清除输出配置并提示用户（已确认）
- **子类型切换**：不支持切换，子类型选择后锁定（如需更换需删除节点重新拖拽）（已确认）
- **连接约束违反**：阻止连接并显示Toast提示（已确认）
- **训练/推断模式切换**：不支持切换，模式在创建时确定（如需更换需删除节点重新拖拽）（已确认）

### Error Handling

- **参数验证失败**：实时内联提示（输入时即显示错误）（已确认）

## Requirements *(mandatory)*

### Functional Requirements

#### FR-001: 菜单结构
- **FR-001.1**: 系统必须提供四类二级菜单：预处理、特征工程、横向模型、纵向模型
- **FR-001.2**: 系统必须在训练和推断两个Tab页下都显示相同的二级菜单
- **FR-001.3**: 每个二级菜单下必须包含对应的三级任务列表

#### FR-002: 预处理任务
- **FR-002.1**: 系统必须提供"数据清洗"任务，支持5种子类型：缺失值处理、异常值处理、样本去重、类型转换、格式标准化
- **FR-002.2**: 系统必须提供"数据采样"任务，支持5种子类型：随机采样、分层采样、按比例采样、按数量采样、上采样
- **FR-002.3**: 数据清洗必须为单方本地任务，只能连接1个数据源
- **FR-002.4**: 数据采样必须为动态任务，根据连接数量决定执行类型

#### FR-003: 特征工程任务
- **FR-003.1**: 系统必须提供"特征分箱"任务，支持2种子类型：等频分箱(输出WOE/IV)、等宽分箱(输出WOE/IV)
- **FR-003.2**: 系统必须提供"特征编码"任务，支持2种子类型：独热编码、标签编码
- **FR-003.3**: 系统必须提供"特征变换"任务，支持2种子类型：对数变换、幂变换
- **FR-003.4**: 系统必须提供"特征选择"任务，支持3种子类型：基于阈值(iv)、topK(iv)、topPercentile(iv)
- **FR-003.5**: 系统必须提供"特征缩放"任务，支持2种子类型：归一化、标准化
- **FR-003.6**: 系统必须提供"特征相关性分析"任务，支持2种子类型：皮尔逊相关系数、方差膨胀因子
- **FR-003.7**: 特征编码、特征变换、特征缩放必须为单方本地任务
- **FR-003.8**: 特征分箱、特征选择、特征相关性分析必须为动态任务

#### FR-004: 横向模型任务
- **FR-004.1**: 系统必须提供5种横向模型：横向逻辑回归、横向神经网络、横向XGBoost、横向KMeans、横向KNN
- **FR-004.2**: 所有横向模型必须为多方隐私任务，必须连接2+数据源
- **FR-004.3**: 横向模型训练任务必须提供模型输出方选择

#### FR-005: 纵向模型任务
- **FR-005.1**: 系统必须提供7种纵向模型：纵向逻辑回归、纵向线性回归、纵向神经网络、纵向XGBoost、纵向DeepFM、纵向KMeans、纵向朴素贝叶斯
- **FR-005.2**: 所有纵向模型必须为多方隐私任务，必须连接2+数据源
- **FR-005.3**: 纵向模型训练任务必须提供模型输出方选择

#### FR-006: 任务执行类型
- **FR-006.1**: 系统必须支持三种任务执行类型：单方本地(local)、动态(dynamic)、多方隐私(multi_party)
- **FR-006.2**: 单方本地任务必须只能连接1个数据源
- **FR-006.3**: 多方隐私任务必须连接2+数据源
- **FR-006.4**: 动态任务根据连接数量自动判定为单方本地或多方隐私

#### FR-007: 输入输出规则
- **FR-007.1**: 单方本地任务不显示"添加输出"按钮，输出schema与输入相同
- **FR-007.2**: 多方隐私任务显示"添加输出"按钮，可选择输出方和输出字段
- **FR-007.3**: 动态任务根据实际执行类型动态显示/隐藏"添加输出"按钮
- **FR-007.4**: 训练任务输出选择模型输出方
- **FR-007.5**: 推断任务输出选择数据接收方

#### FR-008: 参数配置
- **FR-008.1**: 系统必须为每个任务提供完整的参数配置界面
- **FR-008.2**: 参数必须支持多种数据类型：数字、文本、选择、布尔、多选
- **FR-008.3**: 参数必须支持必填验证和范围验证
- **FR-008.4**: 子类型切换时必须动态更新参数列表

### Key Entities

- **FLTaskExecutionType**: 任务执行类型枚举（LOCAL/DYNAMIC/MULTI_PARTY）
- **FLTaskSubType**: 任务子类型定义，包含value、label、parameters
- **FLTaskParameterTemplate**: 扩展的任务参数模板，增加executionType和subTypes字段
- **FLTaskConnectionConstraint**: 任务连接约束，定义最小/最大数据源和参与方数量

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户可以在30秒内找到并拖拽任意一种联邦学习任务到画布
- **SC-002**: 用户可以在2分钟内完成任意一种任务的参数配置
- **SC-003**: 100%的任务都有完整的参数定义，参数来源于业界标准框架（FATE、PySyft等）
- **SC-004**: 单方本地任务只能连接1个数据源的约束100%生效
- **SC-005**: 多方隐私任务必须连接2+数据源的约束100%生效
- **SC-006**: 动态任务的类型切换逻辑100%正确执行
- **SC-007**: 95%的用户首次使用就能正确理解三种任务类型的区别（上线后用户调研指标）
- **SC-008**: 任务配置界面的参数验证准确率达到100%

## Clarifications

### Session 2026-03-26

- Q: 当动态任务连接数从多变少时，已有的输出配置如何处理？ → A: 自动清除输出配置并提示用户
- Q: 当用户输入的参数值不符合验证规则时，应如何提示？ → A: 实时内联提示（输入时即显示错误）
- Q: 当用户修改子类型后，已配置的参数如何重置？ → A: 子类型选择后不可变更，无需处理切换场景（如需更换需删除节点重新拖拽）
- Q: 当用户尝试连接不符合约束的数据源时，如何提示？ → A: 阻止连接并显示Toast提示
- Q: 用户是否可以在已创建的任务节点上切换训练/推断模式？ → A: 不支持切换，训练/推断模式在创建时确定，如需更换需删除节点重新拖拽
- Q: 推断任务如何获取可选的已部署模型列表？ → A: 后端接口返回可用模型列表
按任务类型过滤

## Assumptions

- 动态任务使用现有的 JoinType 系统（INNER/CROSS/Union/NoAssoc）
- 子类型在任务配置弹窗中选择，而非拖拽时确定
- 所有参数定义基于 FATE、PySyft、TensorFlow Federated 等业界框架标准
- 模型任务的输出配置复用现有的 OutputConfig.vue 组件框架

## External Dependencies

### API Dependencies

- **GET /api/fl/models**: 获取已部署的联邦学习模型列表，用于推断任务选择模型
  - 请求参数：`taskType` (horizontal/vertical), `modelType` (logistic_regression/xgboost/etc.)
  - 响应：`{ models: [{ modelId, modelName, participants, createdAt }] }`

## Appendix: 任务参数详细定义

### A. 预处理任务参数

#### A.1 数据清洗参数

**缺失值处理**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| strategy | select | delete | delete/mean/median/constant | 处理策略 |
| fillValue | number | 0 | - | 常数填充值（仅constant策略） |
| columns | multiselect | [] | - | 处理的列（空则处理所有） |

**异常值处理**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| method | select | zscore | zscore/iqr | 检测方法（3σ原则/IQR） |
| action | select | delete | delete/clip | 处理方式 |
| threshold | number | 3 | 1-10 | Z-Score阈值（仅zscore方法） |
| columns | multiselect | [] | - | 处理的列 |

**样本去重**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| subset | multiselect | [] | - | 去重依据列（空则全列） |
| keep | select | first | first/last/none | 保留策略 |

**类型转换**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| column | select | - | - | 要转换的列 |
| targetType | select | - | int/float/string/bool/datetime | 目标类型 |
| format | text | %Y-%m-%d | - | 日期格式（仅datetime） |

**格式标准化**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| columns | multiselect | [] | - | 标准化的列 |
| trimWhitespace | boolean | true | - | 去除空白 |
| lowercase | boolean | false | - | 转小写 |
| uppercase | boolean | false | - | 转大写 |

#### A.2 数据采样参数

**随机采样**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| ratio | number | 0.8 | 0.01-1.0 | 采样比例 |
| randomState | number | 42 | - | 随机种子 |

**分层采样**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| stratifyColumn | select | - | - | 分层依据列 |
| ratio | number | 0.8 | 0.01-1.0 | 每层采样比例 |
| randomState | number | 42 | - | 随机种子 |

**按比例采样**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| ratio | number | 0.5 | 0.01-1.0 | 采样比例 |

**按数量采样**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| count | number | 1000 | 1-1000000 | 采样数量 |
| randomState | number | 42 | - | 随机种子 |

**上采样**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| targetColumn | select | - | - | 目标列（少数类） |
| method | select | oversample | oversample/smote | 上采样方法 |
| ratio | number | 1.0 | 0.1-1.0 | 目标比例 |

### B. 特征工程任务参数

#### B.1 特征分箱参数

**等频分箱(输出WOE/IV)**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| nBins | number | 10 | 2-100 | 分箱数量 |
| columns | multiselect | [] | - | 分箱列 |
| outputWOE | boolean | true | - | 输出WOE值 |
| outputIV | boolean | true | - | 输出IV值 |
| labelColumn | select | - | - | 标签列（计算WOE/IV必需） |

**等宽分箱(输出WOE/IV)**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| nBins | number | 10 | 2-100 | 分箱数量 |
| columns | multiselect | [] | - | 分箱列 |
| outputWOE | boolean | true | - | 输出WOE值 |
| outputIV | boolean | true | - | 输出IV值 |
| labelColumn | select | - | - | 标签列 |

#### B.2 特征编码参数

**独热编码**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| columns | multiselect | [] | - | 编码列 |
| dropFirst | boolean | false | - | 删除第一列（避免共线性） |
| handleUnknown | select | ignore | ignore/error | 未知类别处理 |

**标签编码**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| columns | multiselect | [] | - | 编码列 |
| handleUnknown | select | ignore | ignore/error | 未知类别处理 |

#### B.3 特征变换参数

**对数变换**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| columns | multiselect | [] | - | 变换列 |
| base | select | e | e/2/10 | 对数底数 |
| offset | number | 1 | 0-∞ | 偏移量（避免log(0)） |

**幂变换**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| columns | multiselect | [] | - | 变换列 |
| exponent | number | 2 | -10-10 | 指数 |
| boxCox | boolean | false | - | 使用Box-Cox变换 |

#### B.4 特征选择参数

**基于阈值(iv)**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| threshold | number | 0.1 | 0-1 | IV阈值 |
| labelColumn | select | - | - | 标签列 |

**topK(iv)**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| k | number | 10 | 1-1000 | 保留特征数 |
| labelColumn | select | - | - | 标签列 |

**topPercentile(iv)**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| percentile | number | 20 | 1-100 | 保留百分比 |
| labelColumn | select | - | - | 标签列 |

#### B.5 特征缩放参数

**归一化(MinMax)**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| columns | multiselect | [] | - | 缩放列 |
| minRange | number | 0 | - | 最小值 |
| maxRange | number | 1 | - | 最大值 |

**标准化(Z-Score)**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| columns | multiselect | [] | - | 缩放列 |
| withMean | boolean | true | - | 中心化 |
| withStd | boolean | true | - | 标准化 |

#### B.6 特征相关性分析参数

**皮尔逊相关系数**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| columns | multiselect | [] | - | 分析列（空则全列） |
| threshold | number | 0.5 | 0-1 | 高相关性阈值 |

**方差膨胀因子(VIF)**:
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| columns | multiselect | [] | - | 分析列 |
| threshold | number | 10 | 1-100 | 多重共线性阈值 |

### C. 横向模型参数

#### C.1 横向逻辑回归
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| learningRate | number | 0.01 | 0.0001-1 | 学习率 |
| iterations | number | 100 | 1-10000 | 迭代次数 |
| batchSize | number | 32 | 1-10000 | 批次大小 |
| regularization | select | none | none/l1/l2 | 正则化类型 |
| regParam | number | 0.01 | 0-1 | 正则化系数 |
| earlyStop | boolean | true | - | 早停策略 |
| tolerance | number | 0.0001 | 0-0.1 | 收敛阈值 |

#### C.2 横向神经网络
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| hiddenLayers | array | [64,32] | - | 隐藏层结构 |
| activation | select | relu | relu/sigmoid/tanh | 激活函数 |
| learningRate | number | 0.001 | 0.00001-1 | 学习率 |
| epochs | number | 10 | 1-1000 | 训练轮数 |
| batchSize | number | 32 | 1-10000 | 批次大小 |
| optimizer | select | adam | sgd/adam/rmsprop | 优化器 |
| dropout | number | 0.5 | 0-0.9 | Dropout比例 |

#### C.3 横向XGBoost
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| numTrees | number | 100 | 1-1000 | 树的数量 |
| maxDepth | number | 6 | 1-32 | 最大深度 |
| learningRate | number | 0.1 | 0.0001-1 | 学习率 |
| minChildWeight | number | 1 | 0-100 | 最小子节点权重 |
| subsample | number | 0.8 | 0.1-1 | 采样比例 |
| colSampleByTree | number | 0.8 | 0.1-1 | 列采样比例 |
| lambda | number | 1 | 0-100 | L2正则化 |
| alpha | number | 0 | 0-100 | L1正则化 |

#### C.4 横向KMeans
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| nClusters | number | 3 | 1-1000 | 聚类数 |
| maxIterations | number | 300 | 1-10000 | 最大迭代次数 |
| tol | number | 0.0001 | 0-0.1 | 收敛阈值 |
| initMethod | select | k-means++ | random/k-means++ | 初始化方法 |
| nInit | number | 10 | 1-100 | 初始化次数 |

#### C.5 横向KNN
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| nNeighbors | number | 5 | 1-100 | 近邻数 |
| weights | select | uniform | uniform/distance | 权重方式 |
| algorithm | select | auto | auto/ball_tree/kd_tree | 算法 |
| metric | select | minkowski | euclidean/manhattan/minkowski | 距离度量 |
| p | number | 2 | 1-∞ | Minkowski距离参数 |

### D. 纵向模型参数

#### D.1 纵向逻辑回归(SS-LR)
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| learningRate | number | 0.01 | 0.0001-1 | 学习率 |
| iterations | number | 100 | 1-10000 | 迭代次数 |
| batchSize | number | 32 | 1-10000 | 批次大小 |
| encryptionMethod | select | paillier | paillier/ckks | 加密方法 |
| earlyStop | boolean | true | - | 早停策略 |

#### D.2 纵向线性回归
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| learningRate | number | 0.01 | 0.0001-1 | 学习率 |
| iterations | number | 100 | 1-10000 | 迭代次数 |
| batchSize | number | 32 | 1-10000 | 批次大小 |
| regularization | select | l2 | none/l1/l2 | 正则化类型 |
| regParam | number | 0.01 | 0-1 | 正则化系数 |

#### D.3 纵向神经网络
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| splitPoint | number | 2 | 1-100 | 网络分割点 |
| hiddenLayers | array | [64,32] | - | 隐藏层结构 |
| learningRate | number | 0.001 | 0.00001-1 | 学习率 |
| epochs | number | 10 | 1-1000 | 训练轮数 |
| batchSize | number | 32 | 1-10000 | 批次大小 |
| gradientCompression | boolean | false | - | 梯度压缩 |

#### D.4 纵向XGBoost(SecureBoost)
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| numTrees | number | 100 | 1-1000 | 树的数量 |
| maxDepth | number | 6 | 1-32 | 最大深度 |
| learningRate | number | 0.1 | 0.0001-1 | 学习率 |
| secureMethod | select | he | he/ss | 安全方法(同态加密/秘密分享) |
| minSampleSplit | number | 2 | 2-1000 | 分裂最小样本数 |
| subsample | number | 0.8 | 0.1-1 | 采样比例 |

#### D.5 纵向DeepFM
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| embeddingSize | number | 10 | 1-100 | 嵌入维度 |
| hiddenLayers | array | [64,32] | - | 隐藏层结构 |
| learningRate | number | 0.001 | 0.00001-1 | 学习率 |
| epochs | number | 10 | 1-1000 | 训练轮数 |
| batchSize | number | 32 | 1-10000 | 批次大小 |
| dropout | number | 0.5 | 0-0.9 | Dropout比例 |

#### D.6 纵向KMeans
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| nClusters | number | 3 | 1-1000 | 聚类数 |
| maxIterations | number | 300 | 1-10000 | 最大迭代次数 |
| tol | number | 0.0001 | 0-0.1 | 收敛阈值 |
| secureMethod | select | he | he/ss | 安全方法 |

#### D.7 纵向朴素贝叶斯
| 参数名 | 类型 | 默认值 | 范围 | 描述 |
|-------|------|-------|------|------|
| alpha | number | 1.0 | 0-10 | Laplace平滑参数 |
| fitPrior | boolean | true | - | 学习先验概率 |
| classPrior | array | [] | - | 先验概率（空则自动学习） |

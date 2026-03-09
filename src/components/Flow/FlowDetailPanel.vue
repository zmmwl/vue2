<template>
  <div class="flow-detail-panel" :style="{ width: panelWidth + 'px' }" data-testid="flow-detail-panel">
    <!-- 头部 -->
    <div class="detail-header">
      <div class="header-left">
        <h3 class="detail-title">{{ viewMode === 'detail' ? '节点详情' : 'JSON预览' }}</h3>
      </div>
      <div class="header-right">
        <!-- 视图切换按钮 -->
        <div class="view-toggle">
          <button
            class="toggle-button"
            :class="{ active: viewMode === 'detail' }"
            @click="handleViewModeChange('detail')"
          >
            节点详情
          </button>
          <button
            class="toggle-button"
            :class="{ active: viewMode === 'preview' }"
            @click="handleViewModeChange('preview')"
          >
            JSON预览
          </button>
        </div>
        <button
          v-if="viewMode === 'detail' && selectedNode && isDataSourceNode && isConfigured"
          class="edit-button"
          @click="handleEdit"
          aria-label="编辑配置"
        >
          重新配置
        </button>
        <button
          v-if="viewMode === 'detail' && selectedNode && isOutputDataNode"
          class="edit-button"
          @click="handleEditOutput"
          aria-label="编辑输出配置"
        >
          编辑输出配置
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="detail-content">
      <!-- JSON预览模式 -->
      <template v-if="viewMode === 'preview'">
        <JsonPreviewPanel :json="exportJson" />
      </template>

      <!-- 节点详情模式 -->
      <template v-else>
        <!-- 未选中节点 -->
        <div v-if="!selectedNode" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>请选择一个节点查看详情</p>
        </div>

        <!-- 数据源节点 - 未配置 -->
        <div v-else-if="isDataSourceNode && !isConfigured" class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>该节点尚未配置数据资产</p>
        <button class="btn btn-primary" @click="handleEdit">
          立即配置
        </button>
      </div>

      <!-- 数据源节点 - 已配置 -->
      <div v-else-if="isDataSourceNode && isConfigured" class="detail-info">
        <!-- 基本信息 -->
        <div class="info-section">
          <h4 class="section-title">基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">资产名称</span>
              <span class="info-value">{{ assetInfo?.assetName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">资产编号</span>
              <span class="info-value">{{ assetInfo?.assetNumber || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属企业</span>
              <span class="info-value">{{ assetInfo?.participantId ? getEnterpriseDisplayName(assetInfo.participantId) : (assetInfo?.entityName || '-') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据规模</span>
              <span class="info-value">{{ assetInfo?.scale || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">更新周期</span>
              <span class="info-value">{{ assetInfo?.cycle || '-' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="info-label">资产描述</span>
              <span class="info-value">{{ assetInfo?.intro || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 数据库信息 -->
        <div class="info-section">
          <h4 class="section-title">数据库信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">数据库名</span>
              <span class="info-value">{{ dataInfo?.databaseName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">表名</span>
              <span class="info-value">{{ dataInfo?.tableName || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 已选字段 -->
        <div class="info-section">
          <h4 class="section-title">
            已选字段
            <span class="field-count">({{ selectedFields?.length || 0 }})</span>
          </h4>
          <div class="field-list">
            <div
              v-for="field in selectedFieldList"
              :key="field.name"
              class="field-item"
            >
              <div class="field-name">{{ field.name }}</div>
              <div class="field-type">{{ field.dataType }}</div>
              <div v-if="field.isPrimaryKey" class="field-tag primary-key">主键</div>
              <div v-if="field.privacyQuery" class="field-tag privacy">隐私</div>
            </div>
            <div v-if="!selectedFieldList || selectedFieldList.length === 0" class="empty-fields">
              未选择任何字段
            </div>
          </div>
        </div>
      </div>

      <!-- PIR 任务节点 - 必须在 isComputeTaskNode 之前 -->
      <div v-else-if="isPIRTaskNode" class="detail-info">
        <div class="info-section">
          <h4 class="section-title">PIR 任务信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">任务名称</span>
              <span class="info-value">{{ pirTaskData?.label || 'PIR 任务' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">任务类型</span>
              <span class="info-value">隐私信息检索 (PIR)</span>
            </div>
          </div>
        </div>

        <!-- 输入数据源（和 MPC 一样的显示方式）-->
        <CollapsibleSection title="输入数据源" :count="pirInputProvidersCount">
          <div v-if="pirInputProvidersCount === 0" class="empty-inputs">
            <div class="empty-icon">📊</div>
            <p>暂未配置输入数据源</p>
            <p class="empty-hint">PIR 任务需要连接两个数据源：一个普通数据源 + 一个实时数据源</p>
          </div>
          <div v-else class="input-providers-list">
            <div
              v-for="(provider, index) in pirInputProviders"
              :key="provider.sourceNodeId"
              class="provider-card"
              :class="{ 'realtime-source': provider.isRealtime }"
            >
              <div class="provider-header">
                <span class="provider-index">{{ index + 1 }}</span>
                <span class="provider-name">{{ getEnterpriseDisplayName(provider.participantId) || '数据源' }}</span>
                <span class="provider-dataset">{{ provider.dataset || '' }}</span>
                <span v-if="provider.isRealtime" class="realtime-badge">⚡ 实时</span>
                <button class="config-provider-btn" @click="handleConfigPIRInputProvider(provider, index)" title="配置字段">
                  ⚙️ 配置
                </button>
              </div>
              <div class="provider-fields" v-if="provider.fields?.length">
                <div class="fields-header">
                  <span>字段 ({{ provider.fields.length }})</span>
                </div>
                <div class="fields-list">
                  <div
                    v-for="field in provider.fields"
                    :key="field.columnName"
                    class="field-chip"
                  >
                    <span class="field-alias">{{ field.columnAlias || field.columnName }}</span>
                    <span v-if="field.isJoinField" class="join-badge">JOIN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 计算模型列表 -->
        <CollapsibleSection title="计算模型" :count="pirModelsCount">
          <div v-if="pirModelsCount === 0" class="empty-inputs">
            <div class="empty-icon">🧮</div>
            <p>暂未添加计算模型</p>
            <p class="empty-hint">点击节点左侧 + 按钮添加模型</p>
          </div>
          <div v-else class="models-list">
            <div
              v-for="(model, index) in pirModels"
              :key="model.id"
              class="model-card"
            >
              <div class="model-header">
                <span class="model-icon">{{ model.type === 'expression' ? '📝' : '📦' }}</span>
                <span class="model-name">{{ model.name || `模型 ${index + 1}` }}</span>
                <span class="model-type-badge">{{ model.type === 'expression' ? '表达式' : 'CodeBin' }}</span>
              </div>
              <button class="config-btn" @click="handleConfigPIRModel(model)">
                ⚙️ 配置
              </button>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 输出列表（流式类型） -->
        <CollapsibleSection title="输出配置" :count="pirOutputsCount">
          <div v-if="pirOutputsCount === 0" class="empty-inputs">
            <div class="empty-icon">📤</div>
            <p>暂未配置输出</p>
            <p class="empty-hint">点击节点底部 + 按钮添加流式输出</p>
          </div>
          <div v-else class="outputs-list">
            <div
              v-for="(output, index) in pirOutputs"
              :key="output.id"
              class="output-card stream-output"
            >
              <div class="output-header">
                <span class="output-icon">📤</span>
                <span class="output-name">{{ output.name || `输出 ${index + 1}` }}</span>
                <span class="stream-badge">流式</span>
              </div>
              <div v-if="output.fields?.length" class="output-fields">
                <span class="fields-count">{{ output.fields.length }} 个字段</span>
              </div>
              <button class="config-btn" @click="handleConfigPIROutput(output, index)">
                ⚙️ 配置
              </button>
            </div>
          </div>
        </CollapsibleSection>

        <div class="info-section">
          <button class="config-params-btn full-width-btn" @click="handleConfigPIRTask">
            ⚙️ 重新配置任务
          </button>
        </div>
      </div>

      <!-- FL 任务节点 - 必须在 isComputeTaskNode 之前 -->
      <div v-else-if="isFLTaskNode" class="detail-info">
        <div class="info-section">
          <h4 class="section-title">联邦学习任务信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">任务名称</span>
              <span class="info-value">{{ flTaskData?.taskDisplayName || flTaskData?.taskName || 'FL 任务' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">任务类别</span>
              <span class="info-value">{{ flCategoryLabel }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">模式</span>
              <span class="info-value">{{ flModeLabel }}</span>
            </div>
          </div>
        </div>

        <!-- 输入数据源 -->
        <CollapsibleSection title="输入数据源" :count="flTaskData?.inputProviders?.length || 0">
          <div v-if="!flTaskData?.inputProviders?.length" class="empty-inputs">
            <div class="empty-icon">📊</div>
            <p>暂无输入数据源</p>
          </div>
          <div v-else>
            <div v-for="(provider, index) in flTaskData.inputProviders" :key="index" class="provider-card">
              <div class="provider-header">
                <span class="provider-index">{{ index + 1 }}</span>
                <span class="provider-name">{{ provider.dataset || '数据源' }}</span>
                <span class="provider-enterprise">{{ getEnterpriseDisplayName(provider.participantId) }}</span>
              </div>
              <!-- 展示字段列表 -->
              <div class="provider-fields" v-if="provider.fields && provider.fields.length > 0">
                <div class="fields-header">
                  <span class="fields-label">字段 ({{ provider.fields.length }})</span>
                </div>
                <div class="fields-list">
                  <div v-for="field in provider.fields" :key="field.columnName" class="field-tag">
                    <span class="field-name">{{ field.columnName }}</span>
                    <span class="field-type">{{ field.columnType }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 预处理任务：输出字段（与输入一致） -->
        <CollapsibleSection
          v-if="isFLPreprocessTask"
          title="输出字段"
          :count="flOutputFieldsCount"
        >
          <div v-if="!flTaskData?.inputProviders?.length" class="empty-inputs">
            <div class="empty-icon">📤</div>
            <p>请先配置输入数据源</p>
          </div>
          <div v-else class="output-fields-section">
            <p class="output-hint">预处理任务的输出结构与输入一致</p>
            <div class="output-fields-list">
              <div v-for="field in flOutputFields" :key="field.columnName" class="field-tag output-field">
                <span class="field-name">{{ field.columnName }}</span>
                <span class="field-type">{{ field.columnType }}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 特征工程任务：输出数据（类似 MPC，可添加多个） -->
        <CollapsibleSection
          v-if="isFLFeatureEngineeringTask"
          title="输出数据"
          :count="flOutputsCount"
        >
          <div v-if="!flOutputs || flOutputs.length === 0" class="empty-inputs">
            <div class="empty-icon">📤</div>
            <p>暂无输出配置</p>
            <p class="empty-hint">点击任务节点下方的"添加输出"按钮</p>
          </div>
          <div v-else class="outputs-list">
            <div
              v-for="(output, index) in flOutputs"
              :key="index"
              class="output-card"
            >
              <div class="output-header">
                <span class="output-index">{{ Number(index) + 1 }}</span>
                <span class="output-participant">{{ getEnterpriseDisplayName(output.participantId) }}</span>
              </div>
              <div class="output-dataset">{{ output.dataset }}</div>
              <div class="output-fields">
                <span class="fields-count">{{ output.outputFields?.length || 0 }} 个字段</span>
              </div>
              <button class="config-params-btn" @click="handleConfigFLOutput(output, index)">
                ⚙️ 配置
              </button>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 横向/纵向模型任务：模型输出 -->
        <CollapsibleSection
          v-if="isFLModelTask"
          title="模型输出"
          :count="flModelOutputsCount"
        >
          <div v-if="!flModelOutputs || flModelOutputs.length === 0" class="empty-inputs">
            <div class="empty-icon">🤖</div>
            <p>暂无模型输出</p>
            <p class="empty-hint">点击任务节点下方的"添加模型输出"按钮</p>
          </div>
          <div v-else class="outputs-list">
            <div
              v-for="(model, index) in flModelOutputs"
              :key="index"
              class="output-card model-output-card"
            >
              <div class="output-header">
                <span class="output-index">{{ Number(index) + 1 }}</span>
                <span class="output-participant">{{ getEnterpriseDisplayName(model.participantId) }}</span>
              </div>
              <div class="output-dataset">🤖 {{ model.modelName || '模型' }}</div>
              <div class="output-fields">
                <span class="fields-count">{{ model.modelType || '训练模型' }}</span>
              </div>
              <button class="config-params-btn" @click="handleConfigFLModelOutput(model, index)">
                ⚙️ 配置
              </button>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 任务参数配置 -->
        <div class="info-section" v-if="flTaskData?.parameters">
          <h4 class="section-title">参数配置</h4>
          <div class="params-summary">
            <div v-for="(value, key) in flTaskData.parameters" :key="key" class="param-item">
              <span class="param-key">{{ key }}</span>
              <span class="param-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <button class="config-params-btn full-width-btn" @click="handleConfigFLTask">
            ⚙️ 重新配置任务
          </button>
        </div>
      </div>

      <!-- 计算任务节点 (通用) -->
      <div v-else-if="isComputeTaskNode" class="detail-info">
        <!-- 任务基本信息 -->
        <div class="info-section">
          <h4 class="section-title">任务信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">任务名称</span>
              <span class="info-value">{{ selectedNode?.data?.label || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">计算类型</span>
              <span class="info-value">{{ taskTypeLabel || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">技术路径</span>
              <span class="info-value">{{ techPathLabel || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 算法配置 -->
        <CollapsibleSection
          v-if="taskData?.taskType"
          title="算法配置"
          :count="currentAlgorithm?.paramTemplate?.length || 0"
        >
          <AlgorithmSelector
            :compute-type="taskData.taskType"
            :is-t-e-e="taskData.techPath === TechPath.TEE"
            :model-value="taskData.algorithmConfig || null"
            @update:model-value="handleAlgorithmConfigChange"
            @change="handleAlgorithmChange"
          />
          <!-- 动态参数表单 -->
          <DynamicParamForm
            v-if="currentAlgorithm?.paramTemplate?.length"
            :params="currentAlgorithm.paramTemplate"
            :model-value="taskData?.algorithmConfig?.algorithmParams || {}"
            @update:model-value="handleParamValuesChange"
          />
        </CollapsibleSection>

        <!-- 输入数据 -->
        <CollapsibleSection title="输入数据" :count="inputProvidersCount">
          <div v-if="!inputProviders || inputProviders.length === 0" class="empty-inputs">
            <div class="empty-icon">📊</div>
            <p>暂无输入数据</p>
            <p class="empty-hint">从数据源节点拖拽连线到此任务</p>
          </div>
          <template v-else>
            <!-- Join 类型冲突警告 -->
            <div v-if="hasJoinTypeConflicts" class="alert alert-error">
              <span class="alert-icon">❌</span>
              <div class="alert-content">
                <div v-for="(error, index) in joinTypeErrors" :key="index" class="alert-message">
                  {{ error }}
                </div>
                <div class="alert-hint">请调整各数据源的 Join 类型以解决冲突</div>
              </div>
            </div>
            <!-- Join 类型警告 -->
            <div v-if="joinTypeWarnings.length > 0" class="alert alert-warning">
              <span class="alert-icon">⚠️</span>
              <div class="alert-content">
                <div v-for="(warning, index) in joinTypeWarnings" :key="index" class="alert-message">
                  {{ warning }}
                </div>
              </div>
            </div>
            <div class="input-providers-list">
            <div
              v-for="(provider, index) in inputProviders"
              :key="index"
              class="provider-card"
            >
              <div class="provider-header">
                <span class="provider-index">{{ index + 1 }}</span>
                <span class="provider-name">{{ getEnterpriseDisplayName(provider.participantId) }}</span>
                <span class="provider-dataset">{{ provider.dataset }}</span>
                <span v-if="provider.joinType" class="provider-join-type">{{ getJoinTypeLabel(provider.joinType) }}</span>
                <button class="config-provider-btn" @click="handleConfigProvider(provider)" title="配置字段">
                  ⚙️ 配置
                </button>
              </div>
              <div class="provider-fields">
                <div class="fields-header">
                  <span>字段 ({{ provider.fields.length }})</span>
                </div>
                <div class="fields-list">
                  <div
                    v-for="field in provider.fields"
                    :key="field.columnName"
                    class="field-chip"
                    :class="{ 'is-join': field.isJoinField }"
                  >
                    <span class="field-alias">{{ field.columnAlias || field.columnName }}</span>
                    <span v-if="field.isJoinField" class="join-badge">{{ getJoinTypeLabel(field.joinType || 'INNER') }}</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
            <!-- 连接类型 (子 section) -->
            <div v-if="joinConditions && joinConditions.length > 0" class="join-conditions-wrapper">
              <div class="join-conditions-card">
                <div class="card-header">
                  <div class="card-header-left">
                    <span class="card-title">连接类型</span>
                    <span class="card-count">{{ joinConditions.length }}</span>
                  </div>
                  <button v-if="hasUnionProviders" class="config-provider-btn" @click="openUnionAlignDialog" title="配置 Union 字段对齐">
                    ⚙️ 配置
                  </button>
                </div>
                <div class="card-body">
                  <div
                    v-for="(condition, index) in joinConditions"
                    :key="index"
                    class="condition-item"
                  >
                    <div class="condition-type">{{ getJoinTypeLabel(condition.joinType) }}</div>
                    <div class="condition-operands">
                      <div
                        v-for="(operand, opIndex) in condition.operands"
                        :key="opIndex"
                        class="operand-item"
                      >
                        <span class="operand-participant">{{ getEnterpriseDisplayName(operand.participantId) }}</span>
                        <span class="operand-dataset">{{ operand.dataset }}</span>
                        <span class="operand-fields">{{ operand.columnNames.join(', ') }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </CollapsibleSection>

        <!-- 计算模型 -->
        <CollapsibleSection title="计算模型" :count="modelsCount">
          <div v-if="!models || models.length === 0" class="empty-inputs">
            <div class="empty-icon">📦</div>
            <p>暂无计算模型</p>
            <p class="empty-hint">从左侧拖拽模型到此任务</p>
          </div>
          <div v-else class="models-list">
            <div
              v-for="(model, index) in models"
              :key="index"
              class="model-card"
            >
              <div class="model-header">
                <span class="model-icon">📦</span>
                <span class="model-type">{{ modelTypeLabel(model) }}</span>
                <span class="model-participant">{{ getEnterpriseDisplayName(model.participantId) }}</span>
              </div>
              <div v-if="model.type === 'expression'" class="model-expression">
                <div class="expression-preview">{{ expressionPreview(model) }}</div>
                <button class="config-params-btn" @click="handleConfigExpression(model)">
                  ⚙️ 编辑表达式
                </button>
              </div>
              <div v-else-if="model.type === 'GROUP_STAT'" class="model-groupby">
                <!-- 分组字段 -->
                <div class="groupby-section">
                  <div class="groupby-title">分组字段 ({{ model.groupByConfig?.groupByFields.length || 0 }})</div>
                  <div class="fields-chip-list">
                    <span v-for="field in model.groupByConfig?.groupByFields" :key="field.fieldId" class="field-chip groupby-chip">
                      {{ field.fieldAlias || field.fieldName }} ({{ field.fieldType }})
                    </span>
                  </div>
                </div>

                <!-- 统计配置 -->
                <div class="statistics-section">
                  <div class="statistics-title">统计配置 ({{ model.groupByConfig?.statistics.length || 0 }})</div>
                  <div v-for="stat in model.groupByConfig?.statistics" :key="stat.id" class="stat-card">
                    <span class="function-badge">{{ stat.functionType }}</span>
                    <span class="field-name">{{ stat.resultAlias }}</span>
                  </div>
                </div>

                <button class="config-params-btn" @click="handleConfigGroupBy(model)">
                  ⚙️ 编辑配置
                </button>
              </div>
              <div v-else class="model-params-content">
                <!-- 进度条组件 -->
                <ModelParamProgress
                  v-if="getModelProgressInfo(model)"
                  :progress-info="getModelProgressInfo(model)!"
                />

                <!-- 参数预览组件 -->
                <ModelParameterPreview
                  v-if="getModelSignatures(model.id)"
                  :signatures="getModelSignatures(model.id) || []"
                  :parameters="model.parameters || []"
                  :available-fields="getAvailableFieldsForModel()"
                />

                <!-- 配置按钮 -->
                <div class="model-params">
                  <span class="params-count">
                    {{ getModelParamCount(model.id) }} 个参数
                    <span v-if="hasUnconfiguredParams(model)" class="unconfigured-hint">
                      (未配置)
                    </span>
                  </span>
                  <button
                    class="config-params-btn"
                    @click="handleConfigParams(model)"
                    :title="'配置参数'"
                  >
                    ⚙️ 配置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 算力资源 -->
        <CollapsibleSection title="算力资源" :count="computeProvidersCount">
          <div v-if="!computeProviders || computeProviders.length === 0" class="empty-inputs">
            <div class="empty-icon">⚡</div>
            <p>暂无算力资源</p>
            <p class="empty-hint">从左侧拖拽算力到此任务</p>
          </div>
          <div v-else class="compute-list">
            <div
              v-for="(compute, index) in computeProviders"
              :key="index"
              class="compute-card"
            >
              <div class="compute-header">
                <span class="compute-icon">⚡</span>
                <span class="compute-name">{{ compute.id }}</span>
                <span class="compute-participant">{{ getEnterpriseDisplayName(compute.participantId) }}</span>
              </div>
              <div class="compute-type">{{ compute.type }}</div>
              <button class="config-params-btn" @click="handleConfigCompute(compute)">
                ⚙️ 配置
              </button>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 输出数据 -->
        <CollapsibleSection title="输出数据" :count="outputsCount">
          <div v-if="!outputs || outputs.length === 0" class="empty-inputs">
            <div class="empty-icon">📤</div>
            <p>暂无输出配置</p>
            <p class="empty-hint">点击任务节点下方的"添加输出"按钮</p>
          </div>
          <div v-else class="outputs-list">
            <div
              v-for="(output, index) in outputs"
              :key="index"
              class="output-card"
            >
              <div class="output-header">
                <span class="output-index">{{ index + 1 }}</span>
                <span class="output-participant">{{ getEnterpriseDisplayName(output.participantId) }}</span>
              </div>
              <div class="output-dataset">{{ output.dataset }}</div>
              <div class="output-fields">
                <span class="fields-count">{{ output.outputFields?.length || 0 }} 个字段</span>
              </div>
              <button class="config-params-btn" @click="handleConfigOutput(output, index)">
                ⚙️ 配置
              </button>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <!-- 输出数据节点 -->
      <div v-else-if="isOutputDataNode" class="detail-info">
        <!-- 基本信息 -->
        <div class="info-section">
          <h4 class="section-title">基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">接收方企业</span>
              <span class="info-value">{{ outputData?.entityName || outputData?.participantId || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据集名称</span>
              <span class="info-value">{{ outputData?.dataset || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属任务</span>
              <span class="info-value">{{ parentTaskNode?.data?.label || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">输出字段数</span>
              <span class="info-value">{{ outputData?.fields?.length || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 输出字段（按来源分组） -->
        <CollapsibleSection title="输出字段" :count="outputData?.fields?.length || 0">
          <div v-if="!outputData?.fields || outputData.fields.length === 0" class="empty-inputs">
            <div class="empty-icon">📋</div>
            <p>暂无输出字段</p>
          </div>
          <div v-else class="output-fields-grouped">
            <!-- 输入数据源字段 -->
            <div v-if="fieldGroups.inputFields.length > 0" class="field-source-group">
              <div
                v-for="[sourceId, sourceInfo] in inputFieldSources"
                :key="sourceId"
                class="source-card"
              >
                <div class="source-header">
                  <span class="source-icon">🗄️</span>
                  <span class="source-title">{{ getEnterpriseDisplayName(sourceInfo.participantId) }}</span>
                  <span class="source-dataset">{{ sourceInfo.dataset }}</span>
                </div>
                <div class="source-fields">
                  <div
                    v-for="field in sourceInfo.fields"
                    :key="field.columnName"
                    class="field-item"
                  >
                    <span class="field-name">{{ field.columnAlias || field.columnName }}</span>
                    <span class="field-type">{{ field.columnType }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 模型输出字段 -->
            <div v-if="fieldGroups.modelFields.length > 0" class="field-source-group">
              <div
                v-for="[modelId, modelInfo] in modelFieldSources"
                :key="modelId"
                class="source-card"
              >
                <div class="source-header">
                  <span class="source-icon">{{ modelInfo.type === 'expression' ? '📝' : '📦' }}</span>
                  <span class="source-title">{{ modelInfo.type === 'expression' ? '表达式模型' : modelInfo.name }}</span>
                  <span class="source-count">({{ modelInfo.fields.length }})</span>
                </div>
                <div class="source-fields">
                  <div
                    v-for="field in modelInfo.fields"
                    :key="field.columnName"
                    class="field-item"
                  >
                    <span class="field-name">{{ field.columnAlias || field.columnName }}</span>
                    <span class="field-type">{{ field.columnType }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 无法追溯来源的字段 -->
            <div v-if="hasUntracedFields" class="field-source-group">
              <div class="source-card unknown-source">
                <div class="source-header">
                  <span class="source-icon">❓</span>
                  <span class="source-title">未知来源</span>
                </div>
                <div class="source-fields">
                  <div
                    v-for="field in untracedFields"
                    :key="field.columnName"
                    class="field-item"
                  >
                    <span class="field-name">{{ field.columnAlias || field.columnName }}</span>
                    <span class="field-type">{{ field.columnType }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <!-- 本地任务节点 -->
      <div v-else-if="isLocalTaskNode" class="detail-info">
        <!-- 任务基本信息 -->
        <div class="info-section">
          <h4 class="section-title">任务信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">任务名称</span>
              <span class="info-value">{{ selectedNode?.data?.label || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">执行企业</span>
              <span class="info-value">{{ localTaskData?.entityName || localTaskData?.participantId || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">输出数据集</span>
              <span class="info-value">{{ localTaskData?.outputDataset || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 输入数据 -->
        <CollapsibleSection title="输入数据" :count="localInputProvidersCount">
          <div v-if="!localInputProviders || localInputProviders.length === 0" class="empty-inputs">
            <div class="empty-icon">📊</div>
            <p>暂无输入数据</p>
            <p class="empty-hint">从数据源节点拖拽连线到此任务</p>
          </div>
          <div v-else class="input-providers-list">
            <div
              v-for="(provider, index) in localInputProviders"
              :key="index"
              class="provider-card"
            >
              <div class="provider-header">
                <span class="provider-index">{{ index + 1 }}</span>
                <span class="provider-name">{{ getEnterpriseDisplayName(provider.participantId) }}</span>
                <span class="provider-dataset">{{ provider.dataset }}</span>
              </div>
              <div class="provider-fields">
                <div class="fields-header">
                  <span>字段 ({{ provider.fields.length }})</span>
                </div>
                <div class="fields-list">
                  <div
                    v-for="field in provider.fields"
                    :key="field.columnName"
                    class="field-chip"
                  >
                    <span class="field-alias">{{ field.columnAlias || field.columnName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 表达式列表 -->
        <CollapsibleSection title="表达式配置" :count="localExpressions.length">
          <div v-if="!localExpressions || localExpressions.length === 0" class="empty-inputs">
            <div class="empty-icon">📝</div>
            <p>暂无表达式配置</p>
          </div>
          <div v-else class="expressions-list">
            <div
              v-for="(expr, index) in localExpressions"
              :key="expr.id"
              class="expression-card"
            >
              <div class="expression-header">
                <span class="expression-index">{{ index + 1 }}</span>
                <span class="expression-alias">AS {{ expr.resultAlias }}</span>
              </div>
              <div class="expression-content">{{ expr.expression }}</div>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 分组统计配置 -->
        <CollapsibleSection v-if="localGroupByConfig" title="分组统计" :count="localGroupByConfig?.statistics?.length || 0">
          <div class="groupby-info">
            <!-- 分组字段 -->
            <div class="groupby-section">
              <div class="groupby-title">分组字段 ({{ localGroupByConfig?.groupByFields?.length || 0 }})</div>
              <div class="fields-chip-list">
                <span v-for="field in localGroupByConfig?.groupByFields" :key="field.fieldId" class="field-chip groupby-chip">
                  {{ field.fieldAlias || field.fieldName }} ({{ field.fieldType }})
                </span>
              </div>
            </div>

            <!-- 统计配置 -->
            <div class="statistics-section">
              <div class="statistics-title">统计配置 ({{ localGroupByConfig?.statistics?.length || 0 }})</div>
              <div v-for="stat in localGroupByConfig?.statistics" :key="stat.id" class="stat-card">
                <span class="function-badge">{{ stat.functionType }}</span>
                <span class="field-name">{{ stat.resultAlias }}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <!-- 模型节点 -->
      <div v-else-if="isModelNode" class="detail-info">
        <!-- 模型基本信息 -->
        <div class="info-section">
          <h4 class="section-title">模型信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">模型类型</span>
              <span class="info-value">{{ modelNodeData?.type || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">模型名称</span>
              <span class="info-value">{{ modelNodeData?.name || modelNodeData?.modelId || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属企业</span>
              <span class="info-value">{{ modelNodeData?.entityName || modelNodeData?.participantId || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属任务</span>
              <span class="info-value">{{ parentTaskNode?.data?.label || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 表达式内容 -->
        <div v-if="modelNodeData?.type === 'expression'" class="info-section">
          <h4 class="section-title">表达式内容</h4>
          <div class="expression-content">
            <pre>{{ modelNodeData?.expression || '// 暂无表达式' }}</pre>
          </div>
          <button class="config-params-btn" @click="handleConfigModelNode">
            ⚙️ 编辑表达式
          </button>
        </div>

        <!-- 分组统计配置 -->
        <div v-else-if="modelNodeData?.type === 'GROUP_STAT'" class="info-section">
          <h4 class="section-title">分组统计配置</h4>
          <div class="groupby-info">
            <!-- 分组字段 -->
            <div class="groupby-section">
              <div class="groupby-title">分组字段 ({{ modelNodeData?.groupByConfig?.groupByFields?.length || 0 }})</div>
              <div class="fields-chip-list">
                <span v-for="field in modelNodeData?.groupByConfig?.groupByFields" :key="field.fieldId" class="field-chip groupby-chip">
                  {{ field.fieldAlias || field.fieldName }} ({{ field.fieldType }})
                </span>
              </div>
            </div>
            <!-- 统计配置 -->
            <div class="statistics-section">
              <div class="statistics-title">统计配置 ({{ modelNodeData?.groupByConfig?.statistics?.length || 0 }})</div>
              <div v-for="stat in modelNodeData?.groupByConfig?.statistics" :key="stat.id" class="stat-card">
                <span class="function-badge">{{ stat.functionType }}</span>
                <span class="field-name">{{ stat.resultAlias }}</span>
              </div>
            </div>
          </div>
          <button class="config-params-btn" @click="handleConfigModelNode">
            ⚙️ 编辑配置
          </button>
        </div>

        <!-- 模型参数 -->
        <div v-else class="info-section">
          <h4 class="section-title">模型参数</h4>
          <div v-if="!modelNodeData?.parameters || modelNodeData.parameters.length === 0" class="empty-hint">
            暂无参数配置
          </div>
          <div v-else class="params-list">
            <div v-for="param in modelNodeData?.parameters" :key="param.name" class="param-item">
              <span class="param-name">{{ param.name }}</span>
              <span class="param-value">
                <span v-if="param.bindingType === 'field'" class="param-binding field-binding">
                  🔗 {{ formatFieldRef(param.fieldRef) }}
                </span>
                <span v-else-if="param.bindingType === 'fixed'" class="param-binding fixed-binding">
                  📝 {{ param.fixedValue || '-' }}
                </span>
                <span v-else class="param-binding empty">-</span>
              </span>
            </div>
          </div>
          <button class="config-params-btn" @click="handleConfigModelNode">
            ⚙️ 配置参数
          </button>
        </div>
      </div>

      <!-- 其他节点类型 -->
      <div v-else class="empty-state">
        <div class="empty-icon">ℹ️</div>
        <p>该节点类型暂不支持详情查看</p>
      </div>
      </template>
    </div>

    <!-- 输入数据源配置弹窗 -->
    <InputProviderConfig
      v-model="showInputProviderConfig"
      :provider="configProvider"
      :available-fields="configProviderAvailableFields"
      :participant-name="configProviderParticipantName"
      @confirm="handleInputProviderConfigConfirm"
      @cancel="handleInputProviderConfigCancel"
    />

    <!-- Union 字段对齐弹窗 -->
    <UnionFieldAlignDialog
      v-model="showUnionAlignDialog"
      :providers="unionProviders"
      @confirm="handleUnionAlignConfirm"
      @cancel="handleUnionAlignCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import type { Node } from '@vue-flow/core'
import type { NodeData, ComputeTaskNodeData, ModelParameterSignature, AvailableFieldOption, LocalQueryNodeData, InputProvider, ExpressionConfig, GroupByConfig, FieldInfo, FieldMapping, PIRTaskNodeData, FLTaskNodeData, JoinType, UnionFieldMapping } from '@/types/nodes'
import { ComputeTaskType } from '@/types/nodes'
import type { ExportJson } from '@/types/export'
import { NodeCategory, TechPath } from '@/types/nodes'
import { logger } from '@/utils/logger'
import { getEnterpriseList } from '@/services/enterpriseService'
import { getModelInputSignatures } from '@/services/model-mock-service'
import { generateAvailableFields, calculateParamProgress } from '@/utils/model-config-utils'
import CollapsibleSection from './CollapsibleSection.vue'
import JsonPreviewPanel from './JsonPreviewPanel.vue'
import ModelParamProgress from './ModelCard/ModelParamProgress.vue'
import ModelParameterPreview from './ModelCard/ModelParameterPreview.vue'
import InputProviderConfig from '@/components/Modals/InputProviderConfig.vue'
import UnionFieldAlignDialog from '@/components/Modals/UnionFieldAlignDialog.vue'
import AlgorithmSelector from '@/components/Algorithm/AlgorithmSelector.vue'
import DynamicParamForm from '@/components/Algorithm/DynamicParamForm.vue'
import { algorithmService } from '@/services/algorithmService'
import type { Algorithm, TaskAlgorithmConfig, ParamValue } from '@/types/algorithm'
import { useGraphState } from '@/composables/useGraphState'
import { useJoinValidation } from '@/composables/useJoinValidation'

// 使用共享的图状态管理
const { nodes } = useGraphState()

// 企业数据缓存
const enterpriseCache = ref<Map<string, { name: string; participantId: string }>>(new Map())

// 模型参数签名缓存
const modelSignaturesCache = ref<Map<string, ModelParameterSignature[]>>(new Map())

// 当前选中的算法（用于显示参数表单）
const currentAlgorithm = ref<Algorithm | null>(null)

/**
 * 加载算法详情
 */
async function loadAlgorithmDetail(algorithmId: string) {
  try {
    const response = await algorithmService.getById(algorithmId)
    if (response.code === 0 && response.data) {
      currentAlgorithm.value = response.data
    }
  } catch (error) {
    logger.error('[FlowDetailPanel] Failed to load algorithm detail', error)
  }
}

/**
 * 处理算法配置变化
 */
function handleAlgorithmConfigChange(config: TaskAlgorithmConfig | null) {
  if (!props.selectedNode) return

  const nodeIndex = nodes.value.findIndex(n => n.id === props.selectedNode?.id)
  if (nodeIndex !== -1) {
    const node = nodes.value[nodeIndex]
    if (node) {
      nodes.value[nodeIndex] = {
        ...node,
        data: {
          ...node.data,
          algorithmConfig: config
        } as NodeData
      }
    }
  }
}

/**
 * 处理算法选择变化
 */
function handleAlgorithmChange(algorithm: Algorithm | null) {
  currentAlgorithm.value = algorithm
}

/**
 * 处理参数值变化
 */
function handleParamValuesChange(params: Record<string, ParamValue>) {
  if (!props.selectedNode) return

  const nodeIndex = nodes.value.findIndex(n => n.id === props.selectedNode?.id)
  if (nodeIndex !== -1) {
    const node = nodes.value[nodeIndex]
    if (node && (node.data as ComputeTaskNodeData).algorithmConfig) {
      nodes.value[nodeIndex] = {
        ...node,
        data: {
          ...node.data,
          algorithmConfig: {
            ...(node.data as ComputeTaskNodeData).algorithmConfig!,
            algorithmParams: params
          }
        } as NodeData
      }
    }
  }
}

// 输入数据源配置弹窗状态
const showInputProviderConfig = ref(false)
const configProvider = ref<InputProvider | null>(null)
const configProviderAvailableFields = ref<FieldInfo[]>([])
const configProviderParticipantName = ref('')

// Union 字段对齐弹窗状态
const showUnionAlignDialog = ref(false)

// Union 类型的数据源列表
const unionProviders = computed(() => {
  return inputProviders.value.filter(p => p.joinType === 'Union')
})

// 是否有 Union 类型的数据源
const hasUnionProviders = computed(() => unionProviders.value.length > 0)

/**
 * 加载企业数据
 */
async function loadEnterprises() {
  try {
    const enterprises = await getEnterpriseList()
    enterpriseCache.value = new Map(
      enterprises.map(e => [e.participantId, { name: e.entityName, participantId: e.participantId }])
    )
  } catch (error) {
    logger.error('[FlowDetailPanel] Failed to load enterprises', error)
  }
}

/**
 * 处理测试用的直接打开配置弹窗事件
 */
function handleTestOpenInputProviderConfig(event: Event) {
  const customEvent = event as CustomEvent
  const { provider } = customEvent.detail

  logger.info('[FlowDetailPanel] test-open-input-provider-config event received', { provider })

  configProvider.value = provider
  // 从 provider.fields 生成 availableFields
  configProviderAvailableFields.value = (provider.fields || []).map((field: any) => ({
    name: field.columnName,
    dataType: field.columnType || 'STRING',
    description: '',
    isPrimaryKey: field.isJoinField || false
  }))
  configProviderParticipantName.value = provider.participantId || 'Test Provider'
  showInputProviderConfig.value = true
}

/**
 * 处理测试用的设置 Union providers 事件
 * 用于 E2E 测试中直接在 FlowDetailPanel 设置 Union 类型的输入源
 */
function handleTestSetUnionProviders(event: Event) {
  const customEvent = event as CustomEvent
  const { providers } = customEvent.detail

  console.log('[FlowDetailPanel] test-set-union-providers event received', { providerCount: providers?.length })
  logger.info('[FlowDetailPanel] test-set-union-providers event received', { providerCount: providers?.length })

  if (!providers || providers.length === 0) {
    console.log('[FlowDetailPanel] Invalid providers data')
    logger.warn('[FlowDetailPanel] Invalid test-set-union-providers event data')
    return
  }

  if (!isComputeTaskNode.value || !taskData.value) {
    console.log('[FlowDetailPanel] Not a compute task node or no task data')
    logger.warn('[FlowDetailPanel] Cannot set Union providers: not a compute task node')
    return
  }

  // 设置 inputProviders
  const newInputProviders = providers.map((p: any) => ({
    sourceNodeId: p.sourceNodeId,
    sourceType: 'dataSource' as const,
    participantId: p.participantId,
    dataset: p.dataset,
    fields: p.fields,
    joinType: 'Union' as const
  }))

  // 直接修改 taskData 的 inputProviders
  taskData.value.inputProviders = newInputProviders
  taskData.value.joinConditions = []

  console.log('[FlowDetailPanel] Union providers set', { providerCount: newInputProviders.length })
  logger.info('[FlowDetailPanel] Union providers set', { providerCount: newInputProviders.length })
}

/**
 * 设置 Union providers 的函数（用于测试）
 */
function setUnionProvidersForTest(providers: any[]) {
  console.log('[FlowDetailPanel] setUnionProvidersForTest called', { providerCount: providers?.length })

  if (!providers || providers.length === 0) {
    console.log('[FlowDetailPanel] Invalid providers data')
    return false
  }

  if (!isComputeTaskNode.value || !taskData.value) {
    console.log('[FlowDetailPanel] Not a compute task node or no task data')
    return false
  }

  // 设置 inputProviders
  const newInputProviders = providers.map((p: any) => ({
    sourceNodeId: p.sourceNodeId,
    sourceType: 'dataSource' as const,
    participantId: p.participantId,
    dataset: p.dataset,
    fields: p.fields,
    joinType: 'Union' as const
  }))

  // 直接修改 taskData 的 inputProviders
  taskData.value.inputProviders = newInputProviders
  taskData.value.joinConditions = []

  console.log('[FlowDetailPanel] Union providers set successfully', { providerCount: newInputProviders.length })
  return true
}

// 组件挂载时加载数据和注册事件监听器
onMounted(() => {
  loadEnterprises()
  window.addEventListener('test-open-input-provider-config', handleTestOpenInputProviderConfig)
  window.addEventListener('test-set-union-providers-direct', handleTestSetUnionProviders)
  // 注册全局测试函数
  ;(window as any).__setUnionProvidersForTest = setUnionProvidersForTest
  console.log('[FlowDetailPanel] onMounted - __setUnionProvidersForTest registered')
})

/**
 * 加载模型参数签名
 * 在开始加载时就放入空数组占位符，确保响应式追踪
 */
async function loadModelSignatures(modelId: string) {
  // 如果已经缓存，直接返回
  if (modelSignaturesCache.value.has(modelId)) {
    logger.debug('[FlowDetailPanel] Model signatures cached', { modelId, count: modelSignaturesCache.value.get(modelId)!.length })
    return modelSignaturesCache.value.get(modelId)!
  }

  logger.debug('[FlowDetailPanel] Loading model signatures', { modelId })

  // 先放入空数组占位符，触发响应式更新
  modelSignaturesCache.value.set(modelId, [])

  try {
    const signatures = await getModelInputSignatures(modelId)
    // 加载完成后更新缓存
    modelSignaturesCache.value.set(modelId, signatures)
    logger.debug('[FlowDetailPanel] Model signatures loaded', { modelId, count: signatures.length })
    return signatures
  } catch (error) {
    logger.error('[FlowDetailPanel] Failed to load model signatures', { modelId, error })
    // 失败时保持空数组
    return []
  }
}

/**
 * 获取模型参数签名
 * 确保总是返回缓存中的引用，支持响应式更新
 */
function getModelSignatures(modelId: string): ModelParameterSignature[] {
  if (!modelId) {
    logger.warn('[FlowDetailPanel] getModelSignatures called with empty modelId')
    return []
  }

  if (!modelSignaturesCache.value.has(modelId)) {
    // 如果缓存中没有，立即创建空数组占位符
    modelSignaturesCache.value.set(modelId, [])
    logger.debug('[FlowDetailPanel] Created empty signature cache for modelId', { modelId })
  }

  const signatures = modelSignaturesCache.value.get(modelId)!
  logger.debug('[FlowDetailPanel] getModelSignatures', { modelId, count: signatures.length })
  return signatures
}

/**
 * 获取模型可用字段列表
 */
function getAvailableFieldsForModel(): AvailableFieldOption[] {
  if (!taskData.value) return []
  return generateAvailableFields(taskData.value)
}

/**
 * 获取模型配置进度信息
 */
function getModelProgressInfo(model: any) {
  if (model.type === 'expression') return undefined

  const signatures = getModelSignatures(model.id)
  if (!signatures || signatures.length === 0) return undefined

  return calculateParamProgress(model.parameters || [], signatures)
}

/**
 * 获取模型参数总数（从签名中获取）
 */
function getModelParamCount(modelId: string): number {
  const signatures = getModelSignatures(modelId)
  logger.debug('[FlowDetailPanel] getModelParamCount', { modelId, count: signatures?.length || 0 })
  return signatures?.length || 0
}

interface Props {
  panelWidth?: number
  selectedNode: Node<NodeData> | null
  exportJson: ExportJson | null
  viewMode: 'detail' | 'preview'
  nodes: Node<NodeData>[]  // 所有节点，用于追溯字段来源
}

interface Emits {
  (e: 'edit', nodeId: string): void
  (e: 'viewModeChange', mode: 'detail' | 'preview'): void
  (e: 'configParams', data: { modelId: string; modelConfig: any; taskId: string }): void
  (e: 'configGroupBy', data: { modelId: string; taskId: string }): void
  (e: 'configExpression', data: { modelId: string; taskId: string }): void  // 配置表达式模型
  (e: 'configCompute', data: { computeId: string; taskId: string }): void  // 配置算力资源
  (e: 'configOutput', data: { outputIndex: number; taskId: string }): void  // 配置输出数据
  (e: 'configModelNode', data: { nodeId: string; modelType: string }): void  // 配置模型节点
  (e: 'editOutput', nodeId: string): void  // 编辑输出数据节点
  (e: 'configInputProvider', data: {
    taskId: string
    sourceNodeId: string
    fields: any[]
    joinType?: JoinType
    unionFieldMappings?: UnionFieldMapping[]
  }): void  // 配置输入数据源
  (e: 'config-pir-task', nodeId: string): void  // 配置 PIR 任务
  (e: 'config-fl-task', nodeId: string): void  // 配置 FL 任务
  (e: 'config-fl-output', data: { taskId: string; outputIndex: number }): void  // 配置 FL 特征工程输出
  (e: 'config-fl-model-output', data: { taskId: string; outputIndex: number }): void  // 配置 FL 模型输出
}

const props = withDefaults(defineProps<Props>(), {
  panelWidth: 400,
  nodes: () => []
})
const emit = defineEmits<Emits>()

// 判断是否为数据源节点
const isDataSourceNode = computed(() => {
  return props.selectedNode?.data?.category === NodeCategory.DATA_SOURCE
})

// 判断是否为计算任务节点
const isComputeTaskNode = computed(() => {
  return props.selectedNode?.data?.category === NodeCategory.COMPUTE_TASK
})

// 判断是否为输出数据节点
const isOutputDataNode = computed(() => {
  return props.selectedNode?.data?.category === NodeCategory.OUTPUT_DATA
})

// 判断是否为本地任务节点
const isLocalTaskNode = computed(() => {
  return props.selectedNode?.data?.category === NodeCategory.LOCAL_TASK
})

// 判断是否为模型节点
const isModelNode = computed(() => {
  return props.selectedNode?.data?.category === NodeCategory.MODEL
})

// 判断是否为 PIR 任务节点
const isPIRTaskNode = computed(() => {
  const category = props.selectedNode?.data?.category
  const taskType = props.selectedNode?.data?.taskType
  const nodeType = props.selectedNode?.type

  // 支持通过 taskType 或 node.type 判断
  return category === NodeCategory.COMPUTE_TASK &&
         (taskType === ComputeTaskType.PIR || nodeType === 'pir_task')
})

// 判断是否为 FL 任务节点
const isFLTaskNode = computed(() => {
  return props.selectedNode?.data?.category === NodeCategory.COMPUTE_TASK &&
         props.selectedNode?.data?.taskType === ComputeTaskType.FL
})

// PIR 任务节点数据
const pirTaskData = computed((): PIRTaskNodeData | null => {
  if (!isPIRTaskNode.value) return null
  return props.selectedNode?.data as PIRTaskNodeData
})

// PIR 任务的模型列表
const pirModels = computed(() => {
  return pirTaskData.value?.models || []
})

// PIR 任务的模型数量
const pirModelsCount = computed(() => pirModels.value.length)

// PIR 任务的输出列表
const pirOutputs = computed(() => {
  return pirTaskData.value?.outputs || []
})

// PIR 任务的输出数量
const pirOutputsCount = computed(() => pirOutputs.value.length)

// PIR 任务的输入数据源列表（使用 inputProviders）
const pirInputProviders = computed(() => {
  return pirTaskData.value?.inputProviders || []
})

// PIR 任务的输入数据源数量
const pirInputProvidersCount = computed(() => pirInputProviders.value.length)

// FL 任务节点数据
const flTaskData = computed((): FLTaskNodeData | null => {
  if (!isFLTaskNode.value) return null
  return props.selectedNode?.data as FLTaskNodeData
})

// FL 任务类别标签
const flCategoryLabel = computed(() => {
  if (!flTaskData.value) return ''
  const category = flTaskData.value.flCategory
  const categoryMap: Record<string, string> = {
    'preprocess': '预处理',
    'feature_engineering': '特征工程',
    'horizontal': '横向模型',
    'vertical': '纵向模型'
  }
  return categoryMap[category || ''] || ''
})

// FL 模式标签
const flModeLabel = computed(() => {
  if (!flTaskData.value) return ''
  return flTaskData.value.flMode === 'training' ? '训练' : '推断'
})

// 判断是否为 FL 预处理任务
const isFLPreprocessTask = computed(() => {
  return flTaskData.value?.flCategory === 'preprocess'
})

// 判断是否为 FL 特征工程任务
const isFLFeatureEngineeringTask = computed(() => {
  return flTaskData.value?.flCategory === 'feature_engineering'
})

// 判断是否为 FL 模型任务（横向或纵向）
const isFLModelTask = computed(() => {
  const category = flTaskData.value?.flCategory
  return category === 'horizontal' || category === 'vertical'
})

// FL 预处理任务的输出字段（与输入一致）
const flOutputFields = computed(() => {
  if (!flTaskData.value?.inputProviders) return []
  const allFields: { columnName: string; columnType: string; columnAlias: string }[] = []
  flTaskData.value.inputProviders.forEach(provider => {
    provider.fields.forEach(field => {
      if (!allFields.some(f => f.columnName === field.columnName)) {
        allFields.push({
          columnName: field.columnName,
          columnType: field.columnType,
          columnAlias: field.columnAlias
        })
      }
    })
  })
  return allFields
})

// FL 预处理任务的输出字段数量
const flOutputFieldsCount = computed(() => flOutputFields.value.length)

// FL 特征工程任务的输出列表
const flOutputs = computed(() => {
  return (flTaskData.value as any)?.outputs || []
})

// FL 特征工程任务的输出数量
const flOutputsCount = computed(() => flOutputs.value.length)

// FL 模型任务的模型输出列表
const flModelOutputs = computed(() => {
  return (flTaskData.value as any)?.modelOutputs || []
})

// FL 模型任务的模型输出数量
const flModelOutputsCount = computed(() => flModelOutputs.value.length)

// 判断数据源节点是否已配置
const isConfigured = computed(() => {
  return !!(props.selectedNode?.data?.assetInfo && props.selectedNode?.data?.selectedFields)
})

// 获取资产信息
const assetInfo = computed(() => props.selectedNode?.data?.assetInfo)

// 获取数据集信息
const dataInfo = computed(() => props.selectedNode?.data?.assetInfo?.dataInfo)

// 获取已选字段名称列表
const selectedFields = computed(() => props.selectedNode?.data?.selectedFields)

// 获取已选字段详细信息
const selectedFieldList = computed(() => {
  if (!dataInfo.value || !selectedFields.value) {
    return []
  }

  const allFields = dataInfo.value.fieldList || []
  const selectedSet = new Set(selectedFields.value)

  return allFields.filter(field => selectedSet.has(field.name))
})

// 计算任务节点相关
const taskData = computed(() => {
  if (!isComputeTaskNode.value) return null
  return props.selectedNode?.data as ComputeTaskNodeData
})

// 本地任务节点相关
const localTaskData = computed((): LocalQueryNodeData | null => {
  if (!isLocalTaskNode.value) return null
  return props.selectedNode?.data as LocalQueryNodeData
})

// 模型节点数据
const modelNodeData = computed(() => {
  if (!isModelNode.value) return null
  return props.selectedNode?.data as any
})

// 本地任务输入提供者列表
const localInputProviders = computed((): InputProvider[] => {
  return localTaskData.value?.inputProviders || []
})

// 本地任务输入提供者数量
const localInputProvidersCount = computed(() => localInputProviders.value.length)

// 本地任务表达式列表
const localExpressions = computed((): ExpressionConfig[] => {
  return localTaskData.value?.expressions || []
})

// 本地任务分组统计配置
const localGroupByConfig = computed((): GroupByConfig | undefined => {
  return localTaskData.value?.groupByConfig
})

// 任务类型标签
const taskTypeLabel = computed(() => {
  if (!taskData.value) return ''
  const typeMap: Record<string, string> = {
    'PSI': '隐私集合求交',
    'PIR': '隐私信息检索',
    'MPC': '多方安全计算',
    'FL': '联邦学习',
    'CONCAT': '结果拼接',
    'LOCAL_QUERY': '本地Query'
  }
  return typeMap[taskData.value.taskType || ''] || ''
})

// 技术路径标签
const techPathLabel = computed(() => {
  if (!taskData.value?.techPath) return ''
  return taskData.value.techPath === TechPath.TEE ? '硬件 TEE' : '软件密码学'
})

// 输入数据提供者列表
const inputProviders = computed(() => {
  return taskData.value?.inputProviders || []
})

// 输入数据提供者数量
const inputProvidersCount = computed(() => inputProviders.value.length)

// Join 条件列表
const joinConditions = computed(() => {
  return taskData.value?.joinConditions || []
})

// Join 类型兼容性校验
const {
  errors: joinTypeErrors,
  warnings: joinTypeWarnings,
  hasConflicts: hasJoinTypeConflicts
} = useJoinValidation(inputProviders)

// 计算模型列表
const models = computed(() => {
  return taskData.value?.models || []
})

// 计算模型数量
const modelsCount = computed(() => models.value.length)

// 算力资源列表
const computeProviders = computed(() => {
  return taskData.value?.computeProviders || []
})

// 算力资源数量
const computeProvidersCount = computed(() => computeProviders.value.length)

// 输出列表
const outputs = computed(() => {
  return taskData.value?.outputs || []
})

// 输出数量
const outputsCount = computed(() => outputs.value.length)

// ========== 输出数据节点相关 ==========

// 输出数据节点数据
const outputData = computed(() => {
  if (!isOutputDataNode.value) return null
  return props.selectedNode?.data as any
})

// 获取父任务节点（支持输出数据节点和模型节点）
const parentTaskNode = computed(() => {
  // 优先检查输出数据节点
  if (outputData.value?.parentTaskId && props.nodes?.length) {
    return props.nodes.find(n => n.id === outputData.value.parentTaskId)
  }
  // 检查模型节点
  if (modelNodeData.value?.parentTaskId && props.nodes?.length) {
    return props.nodes.find(n => n.id === modelNodeData.value.parentTaskId)
  }
  return null
})

// 父任务数据
const parentTaskData = computed(() => {
  if (!parentTaskNode.value) return null
  return parentTaskNode.value.data as ComputeTaskNodeData
})

// 字段分组（按 input/model 来源）
const fieldGroups = computed(() => {
  if (!outputData.value?.fields) {
    return { inputFields: [], modelFields: [] }
  }

  const inputFields: any[] = []
  const modelFields: any[] = []

  outputData.value.fields.forEach((field: any) => {
    if (field.source === 'input') {
      inputFields.push(field)
    } else {
      modelFields.push(field)
    }
  })

  return { inputFields, modelFields }
})

// 输入字段来源信息（追溯字段来源节点）
const inputFieldSources = computed(() => {
  const sources: Map<string, { participantId: string; dataset: string; fields: any[] }> = new Map()

  if (!parentTaskData.value?.inputProviders) {
    return sources
  }

  parentTaskData.value.inputProviders.forEach((provider) => {
    const key = provider.sourceNodeId
    if (!sources.has(key)) {
      sources.set(key, {
        participantId: provider.participantId,
        dataset: provider.dataset,
        fields: []
      })
    }

    // 找出该数据源提供的字段
    const providerFields = fieldGroups.value.inputFields.filter(field => {
      // 通过字段名匹配判断是否来自该数据源
      return provider.fields.some(pf => pf.columnName === field.columnName)
    })

    sources.get(key)!.fields = providerFields
  })

  return sources
})

// 模型字段来源信息
const modelFieldSources = computed(() => {
  const sources: Map<string, { name: string; type: string; fields: any[] }> = new Map()

  if (!parentTaskData.value?.models) {
    return sources
  }

  parentTaskData.value.models.forEach((model) => {
    const modelId = model.id || model.modelNodeId || ''

    // 找出该模型提供的字段
    const modelFields = fieldGroups.value.modelFields.filter(field => {
      // 对于表达式模型，字段名是 result
      if (model.type === 'expression') {
        return field.columnName === 'result'
      }

      // 对于其他模型，通过父任务的 outputs 配置追溯
      // 检查父任务的 outputs 中是否包含该模型
      const parentOutputs = parentTaskData.value?.outputs || []
      const modelOutput = parentOutputs.find((output: any) =>
        output.outputFields?.some((f: any) =>
          f.source === 'model' &&
          f.columnName === field.columnName &&
          output.participantId === model.participantId
        )
      )

      // 如果在 outputs 配置中找到该字段，并且属于当前模型
      if (modelOutput) {
        return true
      }

      // 兜容方案：通过常见字段名模式匹配
      const commonModelFields = ['result', 'accuracy', 'loss', 'intersection_result', 'intersection_size', 'statistic_value', 'model_accuracy', 'training_loss', 'compute_result']
      return commonModelFields.some(name => field.columnName.includes(name))
    })

    if (modelFields.length > 0) {
      sources.set(modelId, {
        name: model.name,
        type: model.type,
        fields: modelFields
      })
    }
  })

  return sources
})

// 无法追溯来源的字段
const untracedFields = computed(() => {
  const tracedFields = new Set<string>()

  // 收集所有已追溯的字段
  inputFieldSources.value.forEach(source => {
    source.fields.forEach((field: any) => {
      tracedFields.add(field.columnName)
    })
  })

  modelFieldSources.value.forEach(source => {
    source.fields.forEach((field: any) => {
      tracedFields.add(field.columnName)
    })
  })

  // 返回未追溯的字段
  return fieldGroups.value.inputFields.concat(fieldGroups.value.modelFields)
    .filter(field => !tracedFields.has(field.columnName))
})

// 是否有无法追溯的字段
const hasUntracedFields = computed(() => untracedFields.value.length > 0)

/**
 * 获取模型类型标签
 */
function modelTypeLabel(model: any): string {
  const typeMap: Record<string, string> = {
    'expression': '表达式',
    'CodeBin-V2': 'CodeBin-V2',
    'CodeBin-V3-1': 'CodeBin-V3.1',
    'CodeBin-V3-2': 'CodeBin-V3.2',
    'SPDZ': 'SPDZ'
  }
  return typeMap[model.type || ''] || model.type || '未知类型'
}

/**
 * 获取表达式预览
 */
function expressionPreview(model: any): string {
  const expr = model.expression || ''
  return expr.length > 50 ? expr.substring(0, 50) + '...' : expr
}

/**
 * 获取企业显示名称（同时显示企业名称和 participantId）
 */
function getEnterpriseDisplayName(participantId: string): string {
  if (!participantId) return '-'
  const enterprise = enterpriseCache.value.get(participantId)
  if (enterprise) {
    return `${enterprise.name} (${participantId})`
  }
  return participantId
}

/**
 * 格式化字段引用显示
 * fieldRef 格式: participantId.dataset.fieldName
 */
function formatFieldRef(fieldRef: string | undefined): string {
  if (!fieldRef) return '-'
  // 解析字段引用，提取关键信息
  const parts = fieldRef.split('.')
  if (parts.length >= 3) {
    const fieldName = parts[parts.length - 1]
    const dataset = parts[parts.length - 2]
    return `${dataset}.${fieldName}`
  }
  return fieldRef
}

/**
 * 获取 Join 类型标签
 */
function getJoinTypeLabel(joinType: string): string {
  const labels: Record<string, string> = {
    'INNER': 'INNER(内连接)',
    'CROSS': 'CROSS(交叉连接)',
    'Union': 'Union(横向拼接)',
    'NoAssoc': 'NoAssoc(无关联)'
  }
  return labels[joinType] || joinType
}

// 处理编辑按钮点击
function handleEdit() {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Edit clicked', { nodeId: props.selectedNode.id })
  emit('edit', props.selectedNode.id)
}

// 处理编辑输出数据节点
function handleEditOutput() {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Edit output clicked', { nodeId: props.selectedNode.id })
  emit('editOutput', props.selectedNode.id)
}

// 处理视图模式切换
function handleViewModeChange(mode: 'detail' | 'preview') {
  logger.info('[FlowDetailPanel] View mode change', { mode })
  emit('viewModeChange', mode)
}

/**
 * 判断模型是否有未配置的参数
 * 表达式模型无需配置参数
 */
function hasUnconfiguredParams(model: any): boolean {
  if (model.type === 'expression') return false
  // 如果参数为空，表示需要配置
  return !model.parameters || model.parameters.length === 0
}

/**
 * 处理配置参数
 */
function handleConfigParams(model: any) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Config params clicked', {
    modelId: model.id,
    taskId: props.selectedNode.id
  })

  emit('configParams', {
    modelId: model.id,
    modelConfig: model,
    taskId: props.selectedNode.id
  })
}

/**
 * 处理分组统计配置
 */
function handleConfigGroupBy(model: any) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] GroupBy config clicked', {
    modelId: model.id,
    taskId: props.selectedNode.id
  })

  emit('configGroupBy', {
    modelId: model.id,
    taskId: props.selectedNode.id
  })
}

/**
 * 处理表达式模型配置
 */
function handleConfigExpression(model: any) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Expression config clicked', {
    modelId: model.id,
    taskId: props.selectedNode.id
  })

  emit('configExpression', {
    modelId: model.id,
    taskId: props.selectedNode.id
  })
}

/**
 * 处理算力资源配置
 */
function handleConfigCompute(compute: any) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Compute config clicked', {
    computeId: compute.id,
    taskId: props.selectedNode.id
  })

  emit('configCompute', {
    computeId: compute.id,
    taskId: props.selectedNode.id
  })
}

/**
 * 处理输出数据配置
 */
function handleConfigOutput(_output: any, index: number) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Output config clicked', {
    outputIndex: index,
    taskId: props.selectedNode.id
  })

  emit('configOutput', {
    outputIndex: index,
    taskId: props.selectedNode.id
  })
}

/**
 * 处理模型节点配置
 */
function handleConfigModelNode() {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Model node config clicked', {
    nodeId: props.selectedNode.id,
    modelType: modelNodeData.value?.type
  })

  emit('configModelNode', {
    nodeId: props.selectedNode.id,
    modelType: modelNodeData.value?.type || ''
  })
}

/**
 * 处理 PIR 任务配置
 */
function handleConfigPIRTask() {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] PIR task config clicked', {
    nodeId: props.selectedNode.id
  })

  emit('config-pir-task', props.selectedNode.id)
}

/**
 * 处理 PIR 任务输入数据源配置
 */
function handleConfigPIRInputProvider(provider: any, index: number) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] PIR input provider config clicked', {
    providerIndex: index,
    sourceNodeId: provider.sourceNodeId,
    sourceType: provider.sourceType,
    taskId: props.selectedNode.id
  })

  // 查找源节点获取可用字段
  const sourceNode = props.nodes.find(n => n.id === provider.sourceNodeId)
  let availableFields: FieldInfo[] = []

  if (sourceNode) {
    // 根据源节点类型获取字段列表
    if (provider.sourceType === 'outputData' || sourceNode.data?.category === NodeCategory.OUTPUT_DATA) {
      // 输出数据节点 - 从 fields 属性获取字段
      const outputFields = (sourceNode.data as any).fields || []
      availableFields = outputFields.map((field: any) => ({
        name: field.columnName,
        dataType: field.columnType,
        description: field.columnAlias
      }))
      logger.info('[FlowDetailPanel] PIR: Got fields from output node', {
        fieldCount: availableFields.length
      })
    } else if (sourceNode.data?.assetInfo?.dataInfo?.fieldList) {
      // 数据源节点 - 从 assetInfo 获取字段
      availableFields = sourceNode.data.assetInfo.dataInfo.fieldList
      logger.info('[FlowDetailPanel] PIR: Got fields from data source node', {
        fieldCount: availableFields.length
      })
    } else if ((sourceNode.data as any)?.realtimeConfig?.fields) {
      // 实时数据源节点
      availableFields = (sourceNode.data as any).realtimeConfig.fields.map((f: any) => ({
        name: f.name,
        dataType: f.dataType || 'STRING',
        description: f.description || ''
      }))
      logger.info('[FlowDetailPanel] PIR: Got fields from realtime datasource node', {
        fieldCount: availableFields.length
      })
    } else {
      logger.warn('[FlowDetailPanel] PIR: Could not find fields for source node', {
        sourceNodeId: provider.sourceNodeId,
        sourceNodeType: sourceNode.type,
        sourceNodeCategory: sourceNode.data?.category
      })
    }
  } else {
    logger.warn('[FlowDetailPanel] PIR: Source node not found', {
      sourceNodeId: provider.sourceNodeId
    })
  }

  // 设置弹窗数据（和 MPC 任务一样打开配置对话框）
  configProvider.value = provider
  configProviderAvailableFields.value = availableFields
  configProviderParticipantName.value = getEnterpriseDisplayName(provider.participantId)
  showInputProviderConfig.value = true

  logger.info('[FlowDetailPanel] PIR input provider config dialog opened', {
    providerIndex: index,
    availableFieldsCount: availableFields.length
  })
}

/**
 * 处理 PIR 任务模型配置
 */
function handleConfigPIRModel(model: any) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] PIR model config clicked', {
    modelId: model.id,
    modelType: model.type,
    taskId: props.selectedNode.id
  })

  // 根据模型类型发送不同的事件
  if (model.type === 'expression') {
    // 表达式模型：打开表达式编辑器
    emit('configExpression', {
      modelId: model.id,
      taskId: props.selectedNode.id
    })
  } else {
    // 其他模型：打开参数配置对话框
    emit('configParams', {
      modelId: model.id,
      modelConfig: model,
      taskId: props.selectedNode.id
    })
  }
}

/**
 * 处理 PIR 任务输出配置
 */
function handleConfigPIROutput(_output: any, index: number) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] PIR output config clicked', {
    outputIndex: index,
    taskId: props.selectedNode.id
  })

  emit('configOutput', {
    outputIndex: index,
    taskId: props.selectedNode.id
  })
}

/**
 * 处理 FL 任务配置
 */
function handleConfigFLTask() {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] FL task config clicked', {
    nodeId: props.selectedNode.id
  })

  emit('config-fl-task', props.selectedNode.id)
}

/**
 * 处理 FL 特征工程输出配置
 */
function handleConfigFLOutput(_output: any, index: number | string) {
  if (!props.selectedNode) return

  const outputIndex = typeof index === 'string' ? parseInt(index, 10) : index

  logger.info('[FlowDetailPanel] FL output config clicked', {
    taskId: props.selectedNode.id,
    outputIndex
  })

  emit('config-fl-output', {
    taskId: props.selectedNode.id,
    outputIndex
  })
}

/**
 * 处理 FL 模型输出配置
 */
function handleConfigFLModelOutput(_model: any, index: number | string) {
  if (!props.selectedNode) return

  const outputIndex = typeof index === 'string' ? parseInt(index, 10) : index

  logger.info('[FlowDetailPanel] FL model output config clicked', {
    taskId: props.selectedNode.id,
    outputIndex
  })

  emit('config-fl-model-output', {
    taskId: props.selectedNode.id,
    outputIndex
  })
}

/**
 * 处理输入数据源配置
 */
function handleConfigProvider(provider: InputProvider) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Config provider clicked', {
    sourceNodeId: provider.sourceNodeId,
    sourceType: provider.sourceType,
    taskId: props.selectedNode.id
  })

  // 查找源节点获取可用字段
  const sourceNode = props.nodes.find(n => n.id === provider.sourceNodeId)
  let availableFields: FieldInfo[] = []

  if (sourceNode) {
    // 根据源节点类型获取字段列表
    if (provider.sourceType === 'outputData' || sourceNode.data?.category === NodeCategory.OUTPUT_DATA) {
      // 输出数据节点 - 从 fields 属性获取字段
      const outputFields = (sourceNode.data as any).fields || []
      availableFields = outputFields.map((field: any) => ({
        name: field.columnName,
        dataType: field.columnType,
        description: field.columnAlias
      }))
      logger.info('[FlowDetailPanel] Got fields from output node', {
        fieldCount: availableFields.length
      })
    } else if (sourceNode.data?.assetInfo?.dataInfo?.fieldList) {
      // 数据源节点 - 从 assetInfo 获取字段
      availableFields = sourceNode.data.assetInfo.dataInfo.fieldList
      logger.info('[FlowDetailPanel] Got fields from data source node', {
        fieldCount: availableFields.length
      })
    } else if ((sourceNode.data as any).realtimeConfig?.fields) {
      // 实时数据源节点
      availableFields = (sourceNode.data as any).realtimeConfig.fields.map((f: any) => ({
        name: f.name,
        dataType: f.dataType || 'STRING',
        description: f.description || ''
      }))
      logger.info('[FlowDetailPanel] Got fields from realtime datasource node', {
        fieldCount: availableFields.length
      })
    } else {
      logger.warn('[FlowDetailPanel] Could not find fields for source node', {
        sourceNodeId: provider.sourceNodeId,
        sourceNodeType: sourceNode.type,
        sourceNodeCategory: sourceNode.data?.category
      })
    }
  } else {
    logger.warn('[FlowDetailPanel] Source node not found', {
      sourceNodeId: provider.sourceNodeId
    })
  }

  // 设置弹窗数据
  configProvider.value = provider
  configProviderAvailableFields.value = availableFields
  configProviderParticipantName.value = getEnterpriseDisplayName(provider.participantId)
  showInputProviderConfig.value = true
}

/**
 * 处理输入数据源配置确认
 */
function handleInputProviderConfigConfirm(data: {
  sourceNodeId: string
  fields: FieldMapping[]
  joinType?: JoinType
  unionFieldMappings?: UnionFieldMapping[]
}) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Input provider config confirmed', {
    sourceNodeId: data.sourceNodeId,
    taskId: props.selectedNode.id,
    fieldCount: data.fields.length,
    joinType: data.joinType
  })

  emit('configInputProvider', {
    taskId: props.selectedNode.id,
    sourceNodeId: data.sourceNodeId,
    fields: data.fields,
    joinType: data.joinType,
    unionFieldMappings: data.unionFieldMappings
  })

  showInputProviderConfig.value = false
  configProvider.value = null
}

/**
 * 处理输入数据源配置取消
 */
function handleInputProviderConfigCancel() {
  logger.info('[FlowDetailPanel] Input provider config cancelled')
  showInputProviderConfig.value = false
  configProvider.value = null
}

/**
 * 打开 Union 字段对齐弹窗
 */
function openUnionAlignDialog() {
  if (unionProviders.value.length === 0) {
    logger.warn('[FlowDetailPanel] No Union providers to align')
    return
  }
  logger.info('[FlowDetailPanel] Opening Union align dialog', {
    providerCount: unionProviders.value.length
  })
  showUnionAlignDialog.value = true
}

/**
 * 处理 Union 字段对齐确认
 */
function handleUnionAlignConfirm(data: { updatedProviders: InputProvider[] }) {
  logger.info('[FlowDetailPanel] Union align confirmed', {
    providerCount: data.updatedProviders.length
  })

  // 更新每个 provider 的字段配置
  data.updatedProviders.forEach(updatedProvider => {
    emit('configInputProvider', {
      taskId: props.selectedNode!.id,
      sourceNodeId: updatedProvider.sourceNodeId,
      fields: updatedProvider.fields,
      joinType: 'Union'
    })
  })

  showUnionAlignDialog.value = false
}

/**
 * 处理 Union 字段对齐取消
 */
function handleUnionAlignCancel() {
  logger.info('[FlowDetailPanel] Union align cancelled')
  showUnionAlignDialog.value = false
}

// 清理事件监听器
onUnmounted(() => {
  window.removeEventListener('test-open-input-provider-config', handleTestOpenInputProviderConfig)
  window.removeEventListener('test-set-union-providers-direct', handleTestSetUnionProviders)
  delete (window as any).__setUnionProvidersForTest
})

// 监听选中节点变化
watch(() => props.selectedNode, (node) => {
  if (node) {
    logger.debug('[FlowDetailPanel] Node selected', {
      nodeId: node.id,
      nodeType: node.data?.category,
      isConfigured: isConfigured.value
    })

    // 如果是计算任务节点，加载所有模型的参数签名
    if (isComputeTaskNode.value && taskData.value?.models) {
      logger.debug('[FlowDetailPanel] Loading signatures for models', {
        modelCount: taskData.value.models.length,
        models: taskData.value.models.map(m => ({ id: m.id, name: m.name, type: m.type }))
      })
      taskData.value.models.forEach(model => {
        if (model.type !== 'expression') {
          loadModelSignatures(model.id)
        }
      })
    }

    // 如果是计算任务节点且有算法配置，加载算法详情
    if (isComputeTaskNode.value && taskData.value?.algorithmConfig?.algorithmId) {
      loadAlgorithmDetail(taskData.value.algorithmConfig.algorithmId)
    } else {
      currentAlgorithm.value = null
    }
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

// 浮动动画
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.flow-detail-panel {
  width: var(--panel-width);
  height: 100%;
  background: var(--panel-bg);
  backdrop-filter: var(--panel-blur);
  -webkit-backdrop-filter: var(--panel-blur);
  border-left: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg,
    rgba(14, 165, 233, 0.05) 0%,
    rgba(255, 255, 255, 0.95) 100%
  );
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--datasource-blue) 50%,
      transparent 100%
    );
    opacity: 0.3;
  }
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

// 视图切换按钮
.view-toggle {
  display: flex;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  padding: 2px;
}

.toggle-button {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    background: white;
    color: var(--datasource-blue);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &:hover:not(.active) {
    color: var(--text-primary);
  }
}

.detail-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.edit-button {
  padding: 8px 14px;
  border-radius: var(--button-sm-radius);
  font-size: 13px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  color: white;
  border: none;
  cursor: pointer;
  transition: var(--button-transition);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.25);

  &:hover {
    background: linear-gradient(135deg, #0284C7, #0369A1);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--panel-padding);
  background: var(--glass-bg);

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.12);
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 20px;
  opacity: 0.7;
  animation: float 3s ease-in-out infinite;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

// 按钮
.btn {
  padding: var(--button-md-padding);
  border-radius: var(--button-md-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: var(--button-transition);

  &.btn-primary {
    background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
    color: white;
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.25);

    &:hover {
      background: linear-gradient(135deg, #0284C7, #0369A1);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0) scale(0.98);
    }
  }
}

// 详情信息
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.4s ease;
}

.info-section {
  background: var(--info-card-bg);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--info-card-radius);
  padding: var(--info-card-padding);
  box-shadow: var(--shadow-card-sm);
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    box-shadow: var(--shadow-card-md);
    border-color: rgba(14, 165, 233, 0.1);
  }

  // 算法配置区域特殊样式
  &.algorithm-section {
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;

    &:hover {
      box-shadow: none;
      border-color: transparent;
    }
  }
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &::before {
    content: '';
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, var(--datasource-blue), #38BDF8);
    border-radius: 2px;
  }

  .field-count {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: var(--field-tag-radius);
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  word-break: break-word;
  line-height: 1.5;
}

// 字段列表
.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    background: var(--list-item-hover-bg);
    border-color: rgba(14, 165, 233, 0.2);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.08);
  }
}

.field-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

.field-type {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 500;
}

.field-tag {
  font-size: 11px;
  padding: var(--field-tag-padding);
  border-radius: var(--field-tag-radius);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.primary-key {
    background: linear-gradient(135deg, #E6F7FF, #BAE7FF);
    color: #1890FF;
    border: 1px solid rgba(24, 144, 255, 0.2);
  }

  &.privacy {
    background: linear-gradient(135deg, #FFF1F0, #FFCCC7);
    color: #F5222D;
    border: 1px solid rgba(245, 34, 45, 0.2);
  }
}

.empty-fields {
  padding: 32px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  background: var(--info-card-bg);
  border-radius: var(--info-card-radius);
  border: 1px dashed rgba(0, 0, 0, 0.1);
}

// 空输入状态
.empty-inputs {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.6;
  }

  p {
    margin: 8px 0;
    font-size: 14px;
  }

  .empty-hint {
    font-size: 12px;
    color: var(--text-secondary);
    opacity: 0.8;
  }
}

// 输入提供者列表
.input-providers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.provider-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(14, 165, 233, 0.2);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.08);
  }
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-width: 0; // 允许flex子元素收缩

  .provider-index {
    flex-shrink: 0; // 防止收缩
    width: 24px;
    height: 24px;
    min-width: 24px; // 确保最小宽度
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--datasource-blue), #38BDF8);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .provider-name {
    flex: 1;
    min-width: 0; // 允许文本截断
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .provider-dataset {
    flex-shrink: 1; // 允许收缩
    min-width: 0;
    max-width: 120px;
    font-size: 12px;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .provider-join-type {
    flex-shrink: 0;
    font-size: 11px;
    color: #1890ff;
    padding: 2px 8px;
    background: rgba(24, 144, 255, 0.1);
    border-radius: 4px;
    white-space: nowrap;
  }

  .realtime-badge {
    flex-shrink: 0;
  }

  .config-provider-btn {
    flex-shrink: 0; // 防止收缩
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    color: #1890ff;
    background: rgba(24, 144, 255, 0.06);
    border: 1px solid rgba(24, 144, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      background: rgba(24, 144, 255, 0.1);
      border-color: rgba(24, 144, 255, 0.4);
    }

    &:focus-visible {
      outline: 2px solid #1890ff;
      outline-offset: 2px;
      background: rgba(24, 144, 255, 0.15);
    }
  }
}

.alert {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;

  .alert-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .alert-content {
    flex: 1;
  }

  .alert-message {
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .alert-hint {
    font-size: 12px;
    color: inherit;
    opacity: 0.8;
    margin-top: 4px;
  }

  &.alert-error {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    color: #cf1322;
  }

  &.alert-warning {
    background: #fffbe6;
    border: 1px solid #ffe58f;
    color: #d48806;
  }
}

.provider-fields {
  .fields-header {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .fields-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .field-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 6px;
    font-size: 12px;
    transition: all var(--transition-base) var(--easing-smooth);

    &:hover {
      background: rgba(14, 165, 233, 0.08);
      border-color: rgba(14, 165, 233, 0.2);
    }

    &.is-join {
      background: linear-gradient(135deg, #E6F7FF, #BAE7FF);
      border-color: rgba(24, 144, 255, 0.3);
    }

    .field-alias {
      font-weight: 500;
      color: var(--text-primary);
    }

    .join-badge {
      font-size: 10px;
      padding: 2px 6px;
      background: rgba(24, 144, 255, 0.2);
      color: #1890FF;
      border-radius: 4px;
      font-weight: 600;
    }
  }
}

// 连接类型卡片样式
.join-conditions-wrapper {
  margin-top: 12px;

  .join-conditions-card {
    background: var(--glass-bg);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    padding: 12px;
    transition: all var(--transition-base) var(--easing-smooth);

    &:hover {
      border-color: rgba(14, 165, 233, 0.2);
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.08);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);

      .card-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .card-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .card-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        background: rgba(24, 144, 255, 0.1);
        color: #1890ff;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
      }

      .config-provider-btn {
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 500;
        color: #1890ff;
        background: rgba(24, 144, 255, 0.06);
        border: 1px solid rgba(24, 144, 255, 0.2);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;

        &:hover {
          background: rgba(24, 144, 255, 0.1);
          border-color: rgba(24, 144, 255, 0.4);
        }
      }
    }

    .card-body {
      // 不需要额外padding，因为父卡片已有padding: 12px
    }

    .condition-item {
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      &:first-child {
        padding-top: 0;
      }

      .condition-type {
        font-size: 11px;
        font-weight: 600;
        color: #1890ff;
        margin-bottom: 6px;
      }

      .condition-operands {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .operand-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;

        .operand-participant {
          color: var(--text-secondary);
        }

        .operand-dataset {
          color: var(--text-primary);
          font-weight: 500;
        }

        .operand-fields {
          color: var(--text-tertiary);
          font-size: 11px;
        }
      }
    }
  }
}

// 计算模型列表
.models-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(139, 92, 246, 0.2);
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.08);
  }
}

.model-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .model-icon {
    font-size: 18px;
  }

  .model-type {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .model-participant {
    font-size: 11px;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
  }
}

.model-expression {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', monospace;
  background: rgba(0, 0, 0, 0.02);
  padding: 8px;
  border-radius: 4px;
  line-height: 1.4;
  word-break: break-all;

  .config-params-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    color: #1890ff;
    background: rgba(24, 144, 255, 0.06);
    border: 1px solid rgba(24, 144, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(24, 144, 255, 0.1);
      border-color: rgba(24, 144, 255, 0.4);
    }

    &:focus-visible {
      outline: 2px solid #1890ff;
      outline-offset: 2px;
      background: rgba(24, 144, 255, 0.15);
    }
  }
}

// 分组统计模型样式
.model-groupby {
  .groupby-section {
    margin-bottom: 12px;

    .groupby-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    .fields-chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .field-chip.groupby-chip {
        font-size: 10px;
        padding: 2px 6px;
        background: rgba(19, 194, 194, 0.1);
        color: #13c2c2;
        border: 1px solid rgba(19, 194, 194, 0.3);
        border-radius: 3px;
      }
    }
  }

  .statistics-section {
    margin-bottom: 12px;

    .statistics-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 4px;
      margin-bottom: 4px;

      .function-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        background: #1890ff;
        color: white;
        border-radius: 3px;
      }

      .field-count {
        font-size: 10px;
        color: var(--text-secondary);
      }

      .field-name {
        font-size: 11px;
        color: var(--text-secondary);
        margin-left: 6px;
      }
    }
  }

  .config-params-btn {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    color: #1890ff;
    background: rgba(24, 144, 255, 0.06);
    border: 1px solid rgba(24, 144, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(24, 144, 255, 0.1);
      border-color: rgba(24, 144, 255, 0.4);
    }
  }
}

.model-params-content {
  // 为参数预览组件留出空间
  .model-params {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);

    .params-count {
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 500;
      flex: 1;

      .unconfigured-hint {
        color: #fa8c16;
        margin-left: 4px;
      }
    }

    .config-params-btn {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 500;
      color: #1890ff;
      background: rgba(24, 144, 255, 0.06);
      border: 1px solid rgba(24, 144, 255, 0.2);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(24, 144, 255, 0.1);
        border-color: rgba(24, 144, 255, 0.4);
      }
    }
  }
}

.model-params {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  .params-count {
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 500;
    flex: 1;

    .unconfigured-hint {
      color: #fa8c16;
      margin-left: 4px;
    }
  }

  .config-params-btn {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    color: #1890ff;
    background: rgba(24, 144, 255, 0.06);
    border: 1px solid rgba(24, 144, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(24, 144, 255, 0.1);
      border-color: rgba(24, 144, 255, 0.4);
    }
  }
}

// 算力资源列表
.compute-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compute-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(250, 140, 22, 0.2);
    box-shadow: 0 2px 8px rgba(250, 140, 22, 0.08);
  }

  .config-params-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    color: #1890ff;
    background: rgba(24, 144, 255, 0.06);
    border: 1px solid rgba(24, 144, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(24, 144, 255, 0.1);
      border-color: rgba(24, 144, 255, 0.4);
    }

    &:focus-visible {
      outline: 2px solid #1890ff;
      outline-offset: 2px;
      background: rgba(24, 144, 255, 0.15);
    }
  }
}

.compute-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .compute-icon {
    font-size: 18px;
  }

  .compute-name {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .compute-participant {
    font-size: 11px;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
  }
}

.compute-type {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

// 输出列表
.outputs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.output-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(82, 196, 26, 0.2);
    box-shadow: 0 2px 8px rgba(82, 196, 26, 0.08);
  }

  .config-params-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    color: #1890ff;
    background: rgba(24, 144, 255, 0.06);
    border: 1px solid rgba(24, 144, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(24, 144, 255, 0.1);
      border-color: rgba(24, 144, 255, 0.4);
    }

    &:focus-visible {
      outline: 2px solid #1890ff;
      outline-offset: 2px;
      background: rgba(24, 144, 255, 0.15);
    }
  }
}

.output-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .output-index {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #52C41A, #389e0d);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .output-participant {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.output-dataset {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.output-fields {
  .fields-count {
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 500;
  }
}

// ========== 输出数据节点详情样式 ==========

// 字段来源分组容器
.output-fields-grouped {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-source-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 字段来源卡片
.source-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(14, 165, 233, 0.2);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.08);
  }

  &.unknown-source {
    border-color: rgba(250, 173, 20, 0.2);
    opacity: 0.7;

    &:hover {
      border-color: rgba(250, 173, 20, 0.3);
    }
  }
}

.source-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .source-icon {
    font-size: 16px;
  }

  .source-title {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .source-dataset {
    font-size: 11px;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
  }

  .source-count {
    font-size: 11px;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 10px;
  }
}

.source-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .field-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 6px;
    font-size: 12px;

    .field-name {
      flex: 1;
      color: var(--text-primary);
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .field-type {
      flex-shrink: 0;
      font-size: 11px;
      color: var(--text-secondary);
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    }
  }
}

// ========== 本地任务节点详情样式 ==========

// 表达式列表
.expressions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expression-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(19, 194, 194, 0.2);
    box-shadow: 0 2px 8px rgba(19, 194, 194, 0.08);
  }
}

.expression-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .expression-index {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #13C2C2, #36cfc9);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .expression-alias {
    font-size: 12px;
    font-weight: 600;
    color: #13C2C2;
  }
}

.expression-content {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', monospace;
  background: rgba(0, 0, 0, 0.02);
  padding: 8px;
  border-radius: 4px;
  line-height: 1.4;
  word-break: break-all;
}

// 分组统计信息
.groupby-info {
  .groupby-section {
    margin-bottom: 12px;

    .groupby-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    .fields-chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .field-chip.groupby-chip {
        font-size: 10px;
        padding: 2px 6px;
        background: rgba(19, 194, 194, 0.1);
        color: #13c2c2;
        border: 1px solid rgba(19, 194, 194, 0.3);
        border-radius: 3px;
      }
    }
  }

  .statistics-section {
    .statistics-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 4px;
      margin-bottom: 4px;

      .function-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        background: #13c2c2;
        color: white;
        border-radius: 3px;
      }

      .field-name {
        font-size: 11px;
        color: var(--text-secondary);
      }
    }
  }
}

// 模型节点详情样式
.expression-content {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;

  pre {
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #333;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

// 模型节点详情面板中的配置按钮样式（统一风格）
.info-section {
  .config-params-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #1890ff;
    background: rgba(24, 144, 255, 0.06);
    border: 1px solid rgba(24, 144, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 8px;

    &:hover {
      background: rgba(24, 144, 255, 0.1);
      border-color: rgba(24, 144, 255, 0.4);
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

.params-list {
  margin-bottom: 12px;

  .param-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 4px;
    margin-bottom: 6px;

    .param-name {
      font-size: 12px;
      font-weight: 500;
      color: #333;
    }

    .param-value {
      font-size: 12px;
      color: #666;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .param-binding {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 3px;

      &.field-binding {
        color: #1890ff;
        background: rgba(24, 144, 255, 0.1);
      }

      &.fixed-binding {
        color: #52c41a;
        background: rgba(82, 196, 26, 0.1);
      }

      &.empty {
        color: #999;
      }
    }
  }
}

// 表达式预览样式
.expression-preview {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ========== PIR 任务节点样式 ==========

.realtime-source {
  border-color: rgba(19, 194, 194, 0.3);
  background: linear-gradient(135deg, rgba(19, 194, 194, 0.05), rgba(19, 194, 194, 0.02));

  .realtime-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    background: linear-gradient(135deg, #13c2c2, #36cfc9);
    color: white;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .field-type-badge {
    font-size: 10px;
    padding: 2px 6px;
    background: rgba(19, 194, 194, 0.1);
    color: #13c2c2;
    border: 1px solid rgba(19, 194, 194, 0.3);
    border-radius: 3px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  }
}

// ========== FL 任务节点样式 ==========

.full-width-btn {
  width: 100%;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  justify-content: center;
}
</style>

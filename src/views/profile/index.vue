<template>
  <div class="profile-page qd-workspace-page qd-page-frame" :class="{ 'theme-dark': isDarkTheme }">
    <div class="page-header">
      <h2 class="page-title">
        <a-icon type="user" />
        <span>{{ $t('profile.title') || 'My Profile' }}</span>
      </h2>
      <p class="page-desc">{{ $t('profile.description') || 'Manage your account settings and preferences' }}</p>
    </div>

    <div class="profile-overview-grid">
      <a-card :bordered="false" class="profile-card">
        <div class="profile-identity">
          <div class="avatar-editor">
            <a-upload
              name="avatar"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              :show-upload-list="false"
              :before-upload="beforeAvatarUpload"
              :custom-request="handleAvatarUpload"
              :disabled="avatarUploading"
            >
              <div class="avatar-hitbox" :class="{ uploading: avatarUploading }">
                <a-avatar
                  :size="96"
                  :class="{'default-avatar': !profile.avatar}"
                  :src="profile.avatar || '/avatar.jpg'"
                />
                <div class="avatar-overlay">
                  <a-icon :type="avatarUploading ? 'loading' : 'camera'" />
                  <span>{{ $t('profile.changeAvatar') || 'Change avatar' }}</span>
                </div>
              </div>
            </a-upload>
          </div>
          <div class="profile-identity-copy">
            <h3 class="username">{{ profileDisplayName }}</h3>
            <div class="user-role">
              <a-tag :color="getRoleColor(profile.role)">
                {{ getRoleLabel(profile.role) }}
              </a-tag>
              <a-tag v-if="isVip" color="gold">
                <a-icon type="crown" />
                VIP
              </a-tag>
            </div>
            <a-button
              class="account-center-btn"
              icon="link"
              size="small"
              @click="openAccountCenter"
            >
              {{ $t('profile.accountCenter.open') || 'Open account center' }}
            </a-button>
          </div>
        </div>
        <div class="profile-account-meta">
          <div class="info-item">
            <a-icon type="user" />
            <span class="label">{{ $t('profile.username') || 'Username' }}</span>
            <span class="value">{{ profileAccountUsername }}</span>
          </div>
          <div class="info-item">
            <a-icon type="calendar" />
            <span class="label">{{ $t('profile.lastLogin') || 'Last Login' }}</span>
            <span class="value">{{ formatTime(profile.last_login_at) || '-' }}</span>
          </div>
        </div>
      </a-card>

      <a-card :bordered="false" class="credits-card">
        <div class="credits-header">
          <h3 class="credits-title">
            <a-icon type="wallet" />
            {{ $t('profile.credits.title') || '我的积分' }}
          </h3>
        </div>
        <div class="credits-body">
          <div class="credits-amount">
            <span class="amount-value">{{ formatCredits(billing.credits) }}</span>
            <span class="amount-label">{{ $t('profile.credits.unit') || '积分' }}</span>
          </div>
          <div class="vip-status" v-if="billing.vip_expires_at">
            <a-icon type="crown" :style="{ color: isVip ? '#faad14' : '#999' }" />
            <span v-if="isVip" class="vip-active">
              {{ $t('profile.credits.vipExpires') || 'VIP有效期至' }}: {{ formatDate(billing.vip_expires_at) }}
            </span>
            <span v-else class="vip-expired">
              {{ $t('profile.credits.vipExpired') || 'VIP已过期' }}
            </span>
          </div>
          <div class="vip-status" v-else-if="!billing.is_vip">
            <span class="no-vip">{{ $t('profile.credits.noVip') || '非VIP用户' }}</span>
          </div>
        </div>
        <div class="credits-footer">
          <div class="credits-hint" v-if="billing.billing_enabled">
            <a-icon type="info-circle" />
            <span>{{ $t('profile.credits.hint') || '使用AI分析/回测/监控等功能会消耗积分；VIP仅可免费使用VIP免费指标。' }}</span>
          </div>
          <a-button class="credits-recharge-btn" icon="shopping" @click="handleRecharge">
            {{ $t('profile.credits.recharge') || '开通/充值' }}
          </a-button>
        </div>
      </a-card>

      <a-card :bordered="false" class="referral-card">
        <div class="referral-card-heading">
          <h3 class="referral-title">
            <a-icon type="team" />
            {{ $t('profile.referral.title') || '邀请好友' }}
          </h3>
          <div class="referral-mini-stats">
            <div class="referral-mini-stat">
              <strong>{{ referralData.total || 0 }}</strong>
              <span>{{ $t('profile.referral.totalInvited') || '已邀请' }}</span>
            </div>
            <div v-if="referralData.referral_bonus > 0" class="referral-mini-stat">
              <strong>+{{ referralData.referral_bonus }}</strong>
              <span>{{ $t('profile.referral.bonusPerInvite') || '每邀请获得' }}</span>
            </div>
          </div>
        </div>
        <div class="referral-body">
          <div class="referral-link-section">
            <div class="link-label">{{ $t('profile.referral.yourLink') || '您的邀请链接' }}</div>
            <div class="link-box">
              <a-input :value="referralLink" readonly size="small">
                <a-tooltip slot="suffix" :title="$t('profile.referral.copyLink') || '复制链接'">
                  <a-icon type="copy" style="cursor: pointer" @click="copyReferralLink" />
                </a-tooltip>
              </a-input>
            </div>
          </div>
          <div class="referral-benefits">
            <div class="referral-benefit" v-if="referralData.register_bonus > 0">
              <a-icon type="gift" />
              <span>{{ $t('profile.referral.newUserBonus') || '新用户注册获得' }} {{ referralData.register_bonus }} {{ $t('profile.credits.unit') || '积分' }}</span>
            </div>
            <div class="referral-benefit referral-benefit-membership" v-if="rewardData.enabled && maxReferralRewardRate > 0">
              <a-icon type="crown" />
              <span>{{ $t('profile.referralRewards.membershipRewardHint', { rate: formatRewardRate(maxReferralRewardRate) }) }}</span>
            </div>
          </div>
          <div v-if="rewardData.enabled" class="referral-balance-strip">
            <div class="referral-balance-item referral-balance-primary">
              <span>{{ $t('profile.referralRewards.available') }}</span>
              <strong>{{ formatRewardAmount(rewardData.account.available_balance) }} <small>USD</small></strong>
            </div>
            <div class="referral-balance-item">
              <span>{{ $t('profile.referralRewards.pending') }}</span>
              <strong>{{ formatRewardAmount(rewardData.account.pending_reward_balance) }} USD</strong>
            </div>
            <a-tooltip :title="!rewardData.channels.length ? $t('profile.referralRewards.noEnabledCurrency') : ''">
              <span>
                <a-button class="reward-withdraw-btn" type="primary" size="small" :disabled="!rewardData.channels.length" @click="openRewardWithdrawal">
                  {{ $t('profile.referralRewards.withdraw') }}
                </a-button>
              </span>
            </a-tooltip>
          </div>
        </div>
      </a-card>

      <a-modal
        v-if="rewardData.enabled"
        v-model="rewardWithdrawalVisible"
        :title="$t('profile.referralRewards.withdrawTitle')"
        :confirmLoading="rewardWithdrawalSubmitting"
        @ok="submitRewardWithdrawal"
      >
        <a-alert type="warning" show-icon :message="$t('profile.referralRewards.withdrawNotice')" />
        <a-form layout="vertical" class="reward-withdrawal-form">
          <a-form-item :label="$t('profile.referralRewards.currency')">
            <a-select v-model="rewardWithdrawal.currency" @change="handleRewardWithdrawalCurrencyChange">
              <a-select-option v-for="currency in withdrawalCurrencies" :key="currency" :value="currency">
                {{ currency }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item :label="$t('profile.referralRewards.network')">
            <a-select v-model="rewardWithdrawal.chain">
              <a-select-option v-for="channel in withdrawalChains" :key="`${channel.currency}:${channel.code}`" :value="channel.code">
                {{ channel.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item :label="$t('profile.referralRewards.address')">
            <a-input v-model.trim="rewardWithdrawal.address" />
          </a-form-item>
          <a-form-item :label="$t('profile.referralRewards.amount')">
            <a-input-number v-model="rewardWithdrawal.amount" :min="rewardData.minimum_withdrawal" :max="rewardData.account.available_balance" :precision="2" style="width: 100%" />
            <div class="field-hint">{{ $t('profile.referralRewards.minimum') }}: {{ formatRewardAmount(rewardData.minimum_withdrawal) }} USD</div>
          </a-form-item>
        </a-form>
      </a-modal>
    </div>

    <div class="profile-settings-shell">
      <a-card :bordered="false" class="edit-card">
        <a-tabs v-model="activeTab" :tab-position="profileTabsPosition" class="profile-tabs">
          <!-- Basic Info Tab -->
          <a-tab-pane key="basic">
            <span slot="tab"><a-icon type="idcard" />{{ $t('profile.basicInfo') || 'Basic Info' }}</span>
            <a-form :form="profileForm" layout="vertical" class="profile-form">
              <a-form-item :label="$t('profile.username') || 'Username'">
                <a-input
                  :value="profileAccountUsername"
                  disabled
                >
                  <a-icon slot="prefix" type="user" />
                  <a-tooltip slot="suffix" :title="$t('profile.usernameFromAccount') || 'Username is your account-center email and cannot be changed here'">
                    <a-icon type="info-circle" style="color: rgba(0,0,0,.45)" />
                  </a-tooltip>
                </a-input>
              </a-form-item>

              <div class="account-center-hint">
                <div class="account-center-hint-copy">
                  <strong>{{ $t('profile.accountCenter.title') || 'Account center' }}</strong>
                  <span>{{ $t('profile.accountCenter.hint') || 'Password, email, nickname, and MFA are managed in the account center.' }}</span>
                </div>
                <a-button icon="link" @click="openAccountCenter">
                  {{ $t('profile.accountCenter.open') || 'Open account center' }}
                </a-button>
              </div>

              <a-form-item :label="$t('profile.timezone') || '时区'">
                <a-select
                  v-decorator="['timezone', { initialValue: profile.timezone || '' }]"
                  :placeholder="$t('profile.timezonePlaceholder') || '跟随浏览器/系统'"
                  show-search
                  allow-clear
                  option-filter-prop="children"
                >
                  <a-select-option value="">
                    {{ $t('profile.timezoneBrowser') || '跟随浏览器' }}
                  </a-select-option>
                  <a-select-option v-for="z in timezoneIanaList" :key="z" :value="z">
                    {{ z }}
                  </a-select-option>
                </a-select>
              </a-form-item>

              <a-form-item>
                <a-button type="primary" :loading="saving" @click="handleSaveProfile">
                  <a-icon type="save" />
                  {{ $t('common.save') || 'Save' }}
                </a-button>
              </a-form-item>
            </a-form>
          </a-tab-pane>

          <!-- My Agent Token -->
          <a-tab-pane key="agentTokens">
            <span slot="tab"><a-icon type="api" />{{ $t('profile.agentTokens.tab') || '我的 Agent Token' }}</span>
            <profile-agent-tokens :is-dark-theme="isDarkTheme" />
          </a-tab-pane>

          <a-tab-pane key="credits">
            <span slot="tab"><a-icon type="wallet" />{{ $t('profile.creditsLog') || '消费记录' }}</span>
            <a-table
              :columns="creditsLogColumns"
              :dataSource="creditsLog"
              :loading="creditsLogLoading"
              :pagination="creditsLogPagination"
              :rowKey="record => record.id"
              size="small"
              @change="handleCreditsLogChange"
            >
              <!-- Action Column -->
              <template slot="action" slot-scope="text">
                <a-tag :color="getActionColor(text)">
                  {{ getActionLabel(text) }}
                </a-tag>
              </template>

              <!-- Amount Column -->
              <template slot="amount" slot-scope="text">
                <span :class="text >= 0 ? 'amount-positive' : 'amount-negative'">
                  {{ text >= 0 ? '+' : '' }}{{ text }}
                </span>
              </template>

              <!-- Time Column -->
              <template slot="created_at" slot-scope="text">
                {{ formatCreditsLogTime(text) }}
              </template>
            </a-table>
          </a-tab-pane>

          <a-tab-pane key="notifications">
            <span slot="tab"><a-icon type="bell" />{{ $t('profile.notifications.title') || '通知设置' }}</span>
            <div class="notification-settings-form">
              <a-alert
                :message="$t('profile.notifications.hint') || '配置您的默认通知方式，在创建资产监控和预警时将自动使用这些设置'"
                type="info"
                showIcon
                style="margin-bottom: 24px"
              />

              <a-form :form="notificationForm" layout="vertical" class="notification-settings-fields">
                <!-- Default Channels -->
                <a-form-item class="notification-field-wide">
                  <span slot="label" class="notification-field-label">
                    <a-icon type="bell" />
                    {{ $t('profile.notifications.defaultChannels') || '默认通知渠道' }}
                  </span>
                  <a-checkbox-group
                    v-decorator="['default_channels', { initialValue: notificationSettings.default_channels || ['browser', 'email'] }]"
                  >
                    <a-row :gutter="16">
                      <a-col :span="8">
                        <a-checkbox value="browser">
                          <a-icon type="bell" /> {{ $t('profile.notifications.browser') || '站内通知' }}
                        </a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="telegram">
                          <a-icon type="send" /> Telegram
                        </a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="email">
                          <a-icon type="mail" /> {{ $t('profile.notifications.email') || '邮件' }}
                        </a-checkbox>
                      </a-col>
                    </a-row>
                    <a-row :gutter="16" style="margin-top: 8px">
                      <a-col :span="8">
                        <a-checkbox value="phone">
                          <a-icon type="phone" /> {{ $t('profile.notifications.phone') || '短信' }}
                        </a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="discord">
                          <a-icon type="message" /> Discord
                        </a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="webhook">
                          <a-icon type="api" /> Webhook
                        </a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>
                </a-form-item>

                <div class="notification-fields-grid">
                  <!-- Telegram Bot Token -->
                  <a-form-item>
                    <span slot="label" class="notification-field-label">
                      <a-icon type="robot" />
                      {{ $t('profile.notifications.telegramBotToken') || 'Telegram Bot Token' }}
                    </span>
                    <a-input-password
                      v-decorator="['telegram_bot_token', { initialValue: notificationSettings.telegram_bot_token }]"
                      :placeholder="$t('profile.notifications.telegramBotTokenPlaceholder') || '请输入您的 Telegram Bot Token'"
                    >
                    </a-input-password>
                    <div class="field-hint">
                      <a-icon type="info-circle" />
                      <span>
                        {{ $t('profile.notifications.telegramBotTokenHint') || '通过 @BotFather 创建机器人获取 Token' }}
                        <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather</a>
                      </span>
                    </div>
                  </a-form-item>

                  <!-- Telegram Chat ID -->
                  <a-form-item>
                    <span slot="label" class="notification-field-label">
                      <a-icon type="message" />
                      {{ $t('profile.notifications.telegramChatId') || 'Telegram Chat ID' }}
                    </span>
                    <a-input
                      v-decorator="['telegram_chat_id', { initialValue: notificationSettings.telegram_chat_id }]"
                      :placeholder="$t('profile.notifications.telegramPlaceholder') || '请输入您的 Telegram Chat ID（如 123456789）'"
                    >
                    </a-input>
                    <div class="field-hint">
                      <a-icon type="info-circle" />
                      <span>{{ $t('profile.notifications.telegramHint') || '发送 /start 给 @userinfobot 可获取您的 Chat ID' }}</span>
                    </div>
                  </a-form-item>

                  <!-- Notification Email -->
                  <a-form-item>
                    <span slot="label" class="notification-field-label">
                      <a-icon type="mail" />
                      {{ $t('profile.notifications.notifyEmail') || '通知邮箱' }}
                    </span>
                    <a-input
                      v-decorator="['email', { initialValue: notificationSettings.email || profile.email }]"
                      :placeholder="$t('profile.notifications.emailPlaceholder') || '接收通知的邮箱地址'"
                    >
                    </a-input>
                    <div class="field-hint">
                      <a-icon type="info-circle" />
                      <span>{{ $t('profile.notifications.emailHint') || '默认使用账户邮箱，可设置其他邮箱接收通知' }}</span>
                    </div>
                  </a-form-item>

                  <!-- Phone Number (SMS) -->
                  <a-form-item>
                    <span slot="label" class="notification-field-label">
                      <a-icon type="phone" />
                      {{ $t('profile.notifications.phone') || '手机号（短信通知）' }}
                    </span>
                    <a-input
                      v-decorator="['phone', { initialValue: notificationSettings.phone }]"
                      :placeholder="$t('profile.notifications.phonePlaceholder') || '请输入手机号（如 +8613800138000）'"
                    >
                    </a-input>
                    <div class="field-hint">
                      <a-icon type="info-circle" />
                      <span>{{ $t('profile.notifications.phoneHint') || '需要管理员配置 Twilio 服务后才能使用短信通知' }}</span>
                    </div>
                  </a-form-item>

                  <!-- Discord Webhook -->
                  <a-form-item>
                    <span slot="label" class="notification-field-label">
                      <a-icon type="message" />
                      {{ $t('profile.notifications.discordWebhook') || 'Discord Webhook' }}
                    </span>
                    <a-input
                      v-decorator="['discord_webhook', { initialValue: notificationSettings.discord_webhook }]"
                      :placeholder="$t('profile.notifications.discordPlaceholder') || 'https://discord.com/api/webhooks/...'"
                    >
                    </a-input>
                    <div class="field-hint">
                      <a-icon type="info-circle" />
                      <span>{{ $t('profile.notifications.discordHint') || '在 Discord 服务器设置中创建 Webhook' }}</span>
                    </div>
                  </a-form-item>

                  <!-- Webhook URL -->
                  <a-form-item class="notification-field-wide">
                    <span slot="label" class="notification-field-label">
                      <a-icon type="api" />
                      {{ $t('profile.notifications.webhookUrl') || 'Webhook URL' }}
                    </span>
                    <a-input
                      v-decorator="['webhook_url', { initialValue: notificationSettings.webhook_url }]"
                      :placeholder="$t('profile.notifications.webhookPlaceholder') || 'https://your-server.com/webhook'"
                      @change="handleWebhookUrlChange"
                    >
                    </a-input>
                    <div class="field-hint">
                      <a-icon type="info-circle" />
                      <span>{{ $t('profile.notifications.webhookHint') || '自定义 Webhook 地址，将以 POST JSON 方式推送通知。系统会自动识别飞书 / 钉钉 / 企微 / Slack 链接并转换为对应格式。' }}</span>
                    </div>
                    <!--
                      Show a real-time "detected dialect" badge under the URL
                      input. This is the single most-asked-for hint by users —
                      they want immediate visual confirmation that the system
                      recognised their Feishu/DingTalk/WeCom/Slack link and
                      will speak the right protocol, instead of silently
                      POSTing a generic JSON envelope that the bot rejects.
                    -->
                    <div v-if="webhookDialect && webhookDialect !== 'generic'" class="webhook-dialect">
                      <a-tag :color="webhookDialectColor">
                        <a-icon :type="webhookDialectIcon" />
                        {{ webhookDialectLabel }}
                      </a-tag>
                      <span class="webhook-dialect__hint">
                        {{ $t('profile.notifications.webhookDialectHint') || '已自动识别该平台，无需手动适配 payload 格式' }}
                      </span>
                    </div>
                  </a-form-item>

                  <!-- Webhook Token -->
                  <a-form-item
                    v-if="webhookDialect === 'generic' || !notificationSettings.webhook_url"
                  >
                    <span slot="label" class="notification-field-label">
                      <a-icon type="key" />
                      {{ $t('profile.notifications.webhookToken') || 'Webhook Token（可选）' }}
                    </span>
                    <a-input-password
                      v-decorator="['webhook_token', { initialValue: notificationSettings.webhook_token }]"
                      :placeholder="$t('profile.notifications.webhookTokenPlaceholder') || '用于验证请求的 Bearer Token'"
                    >
                    </a-input-password>
                    <div class="field-hint">
                      <a-icon type="info-circle" />
                      <span>{{ $t('profile.notifications.webhookTokenHint') || '将作为 Authorization: Bearer Token 发送到 Webhook' }}</span>
                    </div>
                  </a-form-item>

                  <!-- Webhook Signing Secret (Feishu / DingTalk / Generic) -->
                  <a-form-item
                    v-if="webhookSupportsSigning"
                  >
                    <span slot="label" class="notification-field-label">
                      <a-icon type="safety" />
                      {{ webhookSigningSecretLabel }}
                    </span>
                    <a-input-password
                      v-decorator="['webhook_signing_secret', { initialValue: notificationSettings.webhook_signing_secret }]"
                      :placeholder="$t('profile.notifications.webhookSigningSecretPlaceholder') || '加签密钥（可选）'"
                    >
                    </a-input-password>
                    <div class="field-hint">
                      <a-icon type="info-circle" />
                      <span>{{ webhookSigningSecretHint }}</span>
                    </div>
                  </a-form-item>
                </div>

                <a-form-item class="notification-field-wide notification-form-actions">
                  <a-button type="primary" :loading="savingNotifications" @click="handleSaveNotifications">
                    <a-icon type="save" />
                    {{ $t('common.save') || '保存' }}
                  </a-button>
                  <a-button style="margin-left: 12px" @click="handleTestNotification" :loading="testingNotification">
                    <a-icon type="experiment" />
                    {{ $t('profile.notifications.testBtn') || '发送测试通知' }}
                  </a-button>
                </a-form-item>
              </a-form>
            </div>
          </a-tab-pane>

          <a-tab-pane key="referrals">
            <span slot="tab"><a-icon type="team" />{{ $t('profile.referral.listTab') || '邀请列表' }}</span>
            <a-tabs v-model="referralRecordTab" class="referral-record-tabs">
              <a-tab-pane key="promotions" :tab="$t('profile.referralRewards.promotionRecords')">
                <a-table
                  :columns="referralColumns"
                  :dataSource="referralData.list || []"
                  :loading="referralLoading"
                  :pagination="referralPagination"
                  :rowKey="record => record.id"
                  :locale="{ emptyText: $t('profile.referral.noReferrals') || '暂无邀请记录' }"
                  size="small"
                  @change="handleReferralChange"
                >
                  <template slot="user" slot-scope="text, record">
                    <div class="referral-user-cell">
                      <a-avatar :size="32" :class="{'default-avatar': !record.avatar}" :src="record.avatar || '/avatar.jpg'" />
                      <div class="user-info">
                        <span class="nickname">{{ record.nickname || record.username }}</span>
                        <span class="username">@{{ record.username }}</span>
                      </div>
                    </div>
                  </template>
                  <template slot="created_at" slot-scope="text">
                    {{ formatTime(text) }}
                  </template>
                </a-table>
              </a-tab-pane>
              <a-tab-pane v-if="rewardData.enabled" key="rewards" :tab="$t('profile.referralRewards.rewardRecords')">
                <a-table
                  :columns="rewardLedgerColumns"
                  :dataSource="rewardData.ledger"
                  :rowKey="record => record.id"
                  :pagination="false"
                  :locale="{ emptyText: $t('profile.referralRewards.noRewardRecords') }"
                  size="small"
                >
                  <template slot="rewardAction" slot-scope="text">
                    {{ getRewardActionLabel(text) }}
                  </template>
                  <template slot="rewardStatus" slot-scope="text">
                    <a-tag :color="getRewardStatusColor(text)">{{ getRewardStatusLabel(text) }}</a-tag>
                  </template>
                </a-table>
              </a-tab-pane>
              <a-tab-pane v-if="rewardData.enabled" key="withdrawals" :tab="$t('profile.referralRewards.withdrawalRecords')">
                <a-table
                  :columns="rewardWithdrawalColumns"
                  :dataSource="rewardData.withdrawals"
                  :rowKey="record => record.id"
                  :pagination="false"
                  :locale="{ emptyText: $t('profile.referralRewards.noWithdrawalRecords') }"
                  size="small"
                >
                  <template slot="withdrawalStatus" slot-scope="text">
                    <a-tag :color="getRewardStatusColor(text)">{{ getRewardStatusLabel(text) }}</a-tag>
                  </template>
                </a-table>
              </a-tab-pane>
            </a-tabs>
          </a-tab-pane>

          <!-- Login Logs Tab (last) -->
          <a-tab-pane key="loginLogs">
            <span slot="tab"><a-icon type="history" />{{ $t('profile.loginLogs.title') || '账户登录日志' }}</span>
            <a-alert
              :message="$t('profile.loginLogs.hint') || '记录密码、验证码与第三方登录；新设备或新地区登录时会通过邮件与站内通知提醒您。'"
              type="info"
              showIcon
              style="margin-bottom: 16px"
            />
            <a-table
              :columns="loginLogColumns"
              :dataSource="loginLogs"
              :loading="loginLogsLoading"
              :pagination="loginLogsPagination"
              :rowKey="record => record.id"
              size="small"
              @change="handleLoginLogsChange"
            >
              <template slot="flags" slot-scope="text, record">
                <a-tag v-if="record.is_new_device" color="orange" style="margin-right: 4px;">
                  {{ $t('profile.loginLogs.newDevice') || '新设备' }}
                </a-tag>
                <a-tag v-if="record.is_new_region" color="red">
                  {{ $t('profile.loginLogs.newRegion') || '新地区' }}
                </a-tag>
                <span v-if="!record.is_new_device && !record.is_new_region">—</span>
              </template>
              <template slot="created_at" slot-scope="text">
                {{ formatTime(text) }}
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </div>

  </div>
</template>

<script>
import { getProfile, updateProfile, uploadProfileAvatar, getLoginLogs, getMyCreditsLog, getMyReferrals, getNotificationSettings, updateNotificationSettings, testNotificationSettings } from '@/api/user'
import { createReferralWithdrawal, getReferralRewards } from '@/api/billing'
import { getSettingsValues, getPublicSettingsConfig } from '@/api/settings'
import { baseMixin } from '@/store/app-mixin'
import ProfileAgentTokens from '@/views/profile/components/ProfileAgentTokens.vue'
import { formatBrowserLocalDateTime } from '@/utils/userTime'

const DEFAULT_NOTIFICATION_CHANNELS = ['browser', 'email']
const normalizeNotificationChannels = channels => (
  Array.isArray(channels) && channels.length ? channels : DEFAULT_NOTIFICATION_CHANNELS
)

export default {
  name: 'Profile',
  components: { ProfileAgentTokens },
  mixins: [baseMixin],
  data () {
    return {
      loading: false,
      saving: false,
      avatarUploading: false,
      activeTab: 'basic',
      profileViewportWidth: 1280,
      profile: {
        id: null,
        username: '',
        nickname: '',
        email: '',
        avatar: '',
        timezone: '',
        role: 'user',
        last_login_at: null
      },
      timezoneIanaList: [
        'UTC',
        'Etc/UTC',
        'Asia/Shanghai',
        'Asia/Hong_Kong',
        'Asia/Taipei',
        'Asia/Tokyo',
        'Asia/Seoul',
        'Asia/Singapore',
        'Asia/Dubai',
        'Asia/Kolkata',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Toronto',
        'America/Sao_Paulo',
        'Australia/Sydney',
        'Pacific/Auckland'
      ],
      // Login logs
      loginLogs: [],
      loginLogsLoading: false,
      loginLogsPagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      // Credits log
      creditsLog: [],
      creditsLogLoading: false,
      creditsLogPagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      // Referral data
      referralData: {
        list: [],
        total: 0,
        referral_code: '',
        referral_bonus: 0,
        register_bonus: 0
      },
      referralLoading: false,
      referralRecordTab: 'promotions',
      referralPagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      rewardData: {
        enabled: false,
        account: { available_balance: 0, pending_reward_balance: 0, pending_withdrawal_balance: 0 },
        ledger: [],
        withdrawals: [],
        channels: [],
        rates: [],
        minimum_withdrawal: 0
      },
      rewardWithdrawalVisible: false,
      rewardWithdrawalSubmitting: false,
      rewardWithdrawal: { currency: '', chain: '', address: '', amount: null },
      billing: {
        credits: 0,
        is_vip: false,
        vip_expires_at: null,
        billing_enabled: false,
        feature_costs: {}
      },
      rechargeTelegramUrl: 'https://t.me/your_support_bot',
      accountCenterUrl: 'https://accounts.trazoom.com',
      // Notification settings
      notificationSettings: {
        default_channels: [...DEFAULT_NOTIFICATION_CHANNELS],
        telegram_bot_token: '',
        telegram_chat_id: '',
        email: '',
        phone: '',
        discord_webhook: '',
        webhook_url: '',
        webhook_token: '',
        webhook_signing_secret: ''
      },
      savingNotifications: false,
      testingNotification: false
    }
  },
  computed: {
    profileTabsPosition () {
      return this.profileViewportWidth >= 960 ? 'left' : 'top'
    },
    isDarkTheme () {
      return this.navTheme === 'dark' || this.navTheme === 'realdark'
    },
    profileDisplayName () {
      // Display name is owned by the account center (synced into nickname on login).
      return this.profile.nickname || this.profileAccountUsername || '-'
    },
    profileAccountUsername () {
      // Account-center identity: always prefer email over legacy local usernames
      // like "admin" that predate account-center linking.
      const email = String(this.profile.email || '').trim()
      if (email) return email
      return this.profile.username || '-'
    },
    isVip () {
      if (!this.billing.vip_expires_at) return false
      const expiresAt = new Date(this.billing.vip_expires_at)
      return expiresAt > new Date()
    },
    loginLogColumns () {
      return [
        {
          title: this.$t('profile.loginLogs.time') || '时间',
          dataIndex: 'created_at',
          width: 170,
          scopedSlots: { customRender: 'created_at' }
        },
        {
          title: this.$t('profile.loginLogs.method') || '方式',
          dataIndex: 'method',
          width: 120
        },
        {
          title: this.$t('profile.loginLogs.device') || '设备',
          dataIndex: 'device',
          ellipsis: true
        },
        {
          title: this.$t('profile.loginLogs.location') || '位置',
          dataIndex: 'location',
          width: 160,
          ellipsis: true,
          customRender: (text) => text || '—'
        },
        {
          title: this.$t('profile.loginLogs.ip') || 'IP',
          dataIndex: 'ip_address',
          width: 130
        },
        {
          title: this.$t('profile.loginLogs.flags') || '提醒',
          width: 140,
          scopedSlots: { customRender: 'flags' }
        }
      ]
    },
    creditsLogColumns () {
      return [
        {
          title: this.$t('profile.creditsLog.time') || '时间',
          dataIndex: 'created_at',
          width: 160,
          scopedSlots: { customRender: 'created_at' }
        },
        {
          title: this.$t('profile.creditsLog.action') || '类型',
          dataIndex: 'action',
          width: 100,
          scopedSlots: { customRender: 'action' }
        },
        {
          title: this.$t('profile.creditsLog.amount') || '变动',
          dataIndex: 'amount',
          width: 100,
          scopedSlots: { customRender: 'amount' }
        },
        {
          title: this.$t('profile.creditsLog.balance') || '余额',
          dataIndex: 'balance_after',
          width: 100
        },
        {
          title: this.$t('profile.creditsLog.remark') || '备注',
          dataIndex: 'remark',
          ellipsis: true
        }
      ]
    },
    referralColumns () {
      return [
        {
          title: this.$t('profile.referral.user') || '用户',
          dataIndex: 'username',
          scopedSlots: { customRender: 'user' }
        },
        {
          title: this.$t('profile.referral.registerTime') || '注册时间',
          dataIndex: 'created_at',
          width: 180,
          scopedSlots: { customRender: 'created_at' }
        }
      ]
    },
    rewardLedgerColumns () {
      return [
        { title: this.$t('profile.referralRewards.time'), dataIndex: 'created_at', width: 180, customRender: text => this.formatTime(text) },
        { title: this.$t('profile.referralRewards.type'), dataIndex: 'action', width: 180, scopedSlots: { customRender: 'rewardAction' } },
        { title: this.$t('profile.referralRewards.amount'), dataIndex: 'amount', width: 120, customRender: text => `${this.formatRewardAmount(text)} USD` },
        { title: this.$t('profile.referralRewards.status'), dataIndex: 'status', width: 120, scopedSlots: { customRender: 'rewardStatus' } }
      ]
    },
    rewardWithdrawalColumns () {
      return [
        { title: this.$t('profile.referralRewards.time'), dataIndex: 'created_at', width: 180, customRender: text => this.formatTime(text) },
        { title: this.$t('profile.referralRewards.channel'), dataIndex: 'chain', width: 150, customRender: (text, row) => `${row.currency} · ${text}` },
        { title: this.$t('profile.referralRewards.amount'), dataIndex: 'amount', width: 120, customRender: text => `${this.formatRewardAmount(text)} USD` },
        { title: this.$t('profile.referralRewards.status'), dataIndex: 'status', width: 120, scopedSlots: { customRender: 'withdrawalStatus' } },
        { title: this.$t('profile.referralRewards.txHash'), dataIndex: 'tx_hash', ellipsis: true }
      ]
    },
    maxReferralRewardRate () {
      const rates = Array.isArray(this.rewardData.rates) ? this.rewardData.rates : []
      return rates.reduce((max, value) => Math.max(max, Number(value) || 0), 0)
    },
    withdrawalCurrencies () {
      return [...new Set(this.rewardData.channels.map(channel => channel.currency).filter(Boolean))]
    },
    withdrawalChains () {
      return this.rewardData.channels.filter(channel => channel.currency === this.rewardWithdrawal.currency)
    },
    referralLink () {
      const baseUrl = window.location.origin + window.location.pathname
      const ref = this.referralData.referral_code || this.profile.id
      return `${baseUrl}#/ai-asset-analysis?ref=${ref}`
    },
    // ---- Webhook dialect detection (mirrors backend logic in
    // signal_notifier.py::_detect_webhook_dialect). Keep the patterns
    // in sync if either side changes.
    webhookDialect () {
      const u = (this.notificationSettings.webhook_url || '').toLowerCase()
      if (!u) return ''
      if (
        u.includes('open.feishu.cn/open-apis/bot/v2/hook/') ||
        u.includes('open.larksuite.com/open-apis/bot/v2/hook/') ||
        u.includes('open.larkoffice.com/open-apis/bot/v2/hook/') ||
        u.includes('www.larksuite.com/open-apis/bot/v2/hook/')
      ) return 'feishu'
      if (u.includes('oapi.dingtalk.com/robot/send')) return 'dingtalk'
      if (u.includes('qyapi.weixin.qq.com/cgi-bin/webhook/send')) return 'wecom'
      if (u.includes('hooks.slack.com/services/')) return 'slack'
      return 'generic'
    },
    webhookDialectLabel () {
      switch (this.webhookDialect) {
        case 'feishu': return this.$t('profile.notifications.dialectFeishu') || '飞书 / Lark 自定义机器人'
        case 'dingtalk': return this.$t('profile.notifications.dialectDingtalk') || '钉钉自定义机器人'
        case 'wecom': return this.$t('profile.notifications.dialectWecom') || '企业微信群机器人'
        case 'slack': return this.$t('profile.notifications.dialectSlack') || 'Slack Incoming Webhook'
        default: return this.$t('profile.notifications.dialectGeneric') || '自定义 / 自托管 Webhook'
      }
    },
    webhookDialectColor () {
      switch (this.webhookDialect) {
        case 'feishu': return 'blue'
        case 'dingtalk': return 'cyan'
        case 'wecom': return 'green'
        case 'slack': return 'purple'
        default: return 'default'
      }
    },
    webhookDialectIcon () {
      switch (this.webhookDialect) {
        case 'feishu':
        case 'wecom':
        case 'dingtalk':
        case 'slack':
          return 'message'
        default: return 'api'
      }
    },
    // Signing-secret box is only shown for dialects that actually
    // support signing. Slack/WeCom embed the secret in the URL so an
    // extra field would only confuse users.
    webhookSupportsSigning () {
      return ['feishu', 'dingtalk', 'generic', ''].includes(this.webhookDialect)
    },
    webhookSigningSecretLabel () {
      const base = this.$t('profile.notifications.webhookSigningSecret') || 'Webhook 加签密钥'
      const tag = this.webhookDialect === 'feishu'
        ? this.$t('profile.notifications.signingFeishuTag') || '（飞书加签）'
        : this.webhookDialect === 'dingtalk'
          ? this.$t('profile.notifications.signingDingtalkTag') || '（钉钉加签）'
          : ''
      return base + tag
    },
    webhookSigningSecretHint () {
      if (this.webhookDialect === 'feishu') {
        return this.$t('profile.notifications.signingFeishuHint') ||
          '飞书机器人「安全设置 → 签名校验」处生成的 secret。系统会按飞书算法把 timestamp + sign 写入消息 body。'
      }
      if (this.webhookDialect === 'dingtalk') {
        return this.$t('profile.notifications.signingDingtalkHint') ||
          '钉钉机器人「安全设置 → 加签」处生成的 secret。系统会按钉钉算法把 timestamp 和 sign 追加到 URL。'
      }
      return this.$t('profile.notifications.signingGenericHint') ||
        '可选。用于 HMAC-SHA256 签名，作为 X-QD-Signature 头部下发，接收端可验签防伪造。'
    }
  },
  watch: {
    activeTab (val) {
      if (val === 'loginLogs' && this.loginLogs.length === 0) {
        this.loadLoginLogs()
      }
      if (val === 'credits' && this.creditsLog.length === 0) {
        this.loadCreditsLog()
      }
      if (val === 'referrals' && (!this.referralData.list || this.referralData.list.length === 0)) {
        this.loadReferrals()
      }
      if (val === 'notifications' && !this.notificationSettings.telegram_chat_id && !this.notificationSettings.discord_webhook) {
        this.loadNotificationSettings()
      }
      // Mirror the active tab into ``?tab=xxx`` so URLs are shareable and
      // browser back/forward preserves state. Compare first to avoid a
      // navigation loop with the $route watcher below.
      if (this.$route.query.tab !== val) {
        this.$router.replace({
          query: { ...this.$route.query, tab: val }
        }).catch(() => {})
      }
    },
    // Respond to deep links from emails or pasted URLs. Allowed tabs are whitelisted so
    // a random ?tab=foo can't break the UI.
    '$route.query.tab' (val) {
      this.applyTabFromQuery(val)
    }
  },
  beforeCreate () {
    this.profileForm = this.$form.createForm(this, { name: 'profile' })
    this.notificationForm = this.$form.createForm(this, { name: 'notification' })
  },
  mounted () {
    this.syncProfileViewport()
    window.addEventListener('resize', this.syncProfileViewport)
    // Honour deep links — sets activeTab before any data loads so we can
    // jump straight to a specific tab.
    this.applyTabFromQuery(this.$route.query.tab)
    this.loadProfile()
    this.loadAccountCenterUrl()
    this.loadReferrals()
    this.loadReferralRewards()
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.syncProfileViewport)
  },
  methods: {
    syncProfileViewport () {
      this.profileViewportWidth = window.innerWidth
    },
    // Whitelist of tabs we accept from ``?tab=xxx``. Anything else is a no-op
    // so a malformed link can't put the page in a weird state.
    applyTabFromQuery (rawTab) {
      const allowed = ['basic', 'agentTokens', 'password', 'security', 'credits', 'notifications', 'referrals', 'loginLogs']
      if (rawTab && allowed.includes(rawTab) && this.activeTab !== rawTab) {
        this.activeTab = rawTab
      }
    },

    async loadProfile () {
      this.loading = true
      try {
        const res = await getProfile()
        if (res.code === 1) {
          this.profile = res.data
          if (res.data.billing) {
            this.billing = res.data.billing
          }
          if (res.data.notification_settings) {
            this.notificationSettings = {
              default_channels: normalizeNotificationChannels(res.data.notification_settings.default_channels),
              telegram_bot_token: res.data.notification_settings.telegram_bot_token || '',
              telegram_chat_id: res.data.notification_settings.telegram_chat_id || '',
              email: res.data.notification_settings.email || res.data.email || '',
              phone: res.data.notification_settings.phone || '',
              discord_webhook: res.data.notification_settings.discord_webhook || '',
              webhook_url: res.data.notification_settings.webhook_url || '',
              webhook_token: res.data.notification_settings.webhook_token || ''
            }
          }
          this.$nextTick(() => {
            this.profileForm.setFieldsValue({
              timezone: this.profile.timezone || ''
            })
          })
        } else {
          this.$message.error(res.msg || 'Failed to load profile')
        }
      } catch (error) {
        this.$message.error('Failed to load profile')
      } finally {
        this.loading = false
      }
    },

    async loadRechargeUrl () {
      if (this.profile.role === 'admin') {
        try {
          const res = await getSettingsValues()
          if (res.code === 1 && res.data && res.data.billing) {
            this.rechargeTelegramUrl = res.data.billing.RECHARGE_TELEGRAM_URL || this.rechargeTelegramUrl
          }
        } catch (e) {
        }
      }
    },

    handleRecharge () {
      this.$router.push('/billing')
    },

    async loadAccountCenterUrl () {
      try {
        const res = await getPublicSettingsConfig()
        const url = res && res.code === 1 && res.data && res.data.account_center_url
        if (url) {
          this.accountCenterUrl = String(url).trim().replace(/\/+$/, '') || this.accountCenterUrl
        }
      } catch (error) {
        // Keep the default issuer when public-config is unavailable.
      }
    },

    openAccountCenter () {
      const url = String(this.accountCenterUrl || 'https://accounts.trazoom.com').trim()
      if (!url) return
      window.open(url, '_blank', 'noopener,noreferrer')
    },

    beforeAvatarUpload (file) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowed.includes(file.type)) {
        this.$message.error(this.$t('profile.avatarTypeInvalid') || 'Use a JPEG, PNG, or WebP image')
        return false
      }
      if (file.size > 2 * 1024 * 1024) {
        this.$message.error(this.$t('profile.avatarTooLarge') || 'Avatar must be 2 MB or smaller')
        return false
      }
      return true
    },

    async handleAvatarUpload ({ file, onSuccess, onError }) {
      this.avatarUploading = true
      try {
        const res = await uploadProfileAvatar(file)
        if (res.code !== 1) {
          throw new Error(res.msg || 'Avatar upload failed')
        }
        const avatar = (res.data && res.data.avatar) || ''
        if (avatar) {
          this.profile.avatar = avatar
        }
        this.$message.success(res.msg || this.$t('profile.avatarUpdated') || 'Avatar updated')
        this.$store.dispatch('FetchUserInfo').catch(() => {})
        if (typeof onSuccess === 'function') onSuccess(res, file)
      } catch (error) {
        const msg = (error && error.message) || this.$t('profile.avatarUploadFailed') || 'Avatar upload failed'
        this.$message.error(msg)
        if (typeof onError === 'function') onError(error)
      } finally {
        this.avatarUploading = false
      }
    },

    formatCredits (credits) {
      if (!credits && credits !== 0) return '0'
      return Number(credits).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    },

    formatDate (dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString()
    },

    handleSaveProfile () {
      this.profileForm.validateFields(async (err, values) => {
        if (err) return

        this.saving = true
        try {
          const res = await updateProfile({
            timezone: values.timezone != null ? values.timezone : ''
          })
          if (res.code === 1) {
            this.$message.success(res.msg || 'Profile updated successfully')
            this.loadProfile()
            this.$store.dispatch('FetchUserInfo').catch(() => {})
          } else {
            this.$message.error(res.msg || 'Update failed')
          }
        } catch (error) {
          this.$message.error('Update failed')
        } finally {
          this.saving = false
        }
      })
    },

    getRoleColor (role) {
      const colors = {
        admin: 'red',
        manager: 'orange',
        user: 'blue',
        viewer: 'default'
      }
      return colors[role] || 'default'
    },

    getRoleLabel (role) {
      const labels = {
        admin: this.$t('userManage.roleAdmin') || 'Admin',
        manager: this.$t('userManage.roleManager') || 'Manager',
        user: this.$t('userManage.roleUser') || 'User',
        viewer: this.$t('userManage.roleViewer') || 'Viewer'
      }
      return labels[role] || role
    },

    formatTime (timestamp) {
      return formatBrowserLocalDateTime(timestamp, { fallback: '' })
    },

    formatCreditsLogTime (timestamp) {
      return formatBrowserLocalDateTime(timestamp, { fallback: '' })
    },

    async loadLoginLogs () {
      this.loginLogsLoading = true
      try {
        const res = await getLoginLogs({
          page: this.loginLogsPagination.current,
          page_size: this.loginLogsPagination.pageSize
        })
        if (res.code === 1) {
          this.loginLogs = res.data.items || []
          this.loginLogsPagination.total = res.data.total || 0
        }
      } catch (e) {
        this.$message.error(this.$t('profile.loginLogs.loadFailed') || '加载登录日志失败')
      } finally {
        this.loginLogsLoading = false
      }
    },

    handleLoginLogsChange (pagination) {
      this.loginLogsPagination.current = pagination.current
      this.loadLoginLogs()
    },

    // Credits log methods
    async loadCreditsLog () {
      this.creditsLogLoading = true
      try {
        const res = await getMyCreditsLog({
          page: this.creditsLogPagination.current,
          page_size: this.creditsLogPagination.pageSize
        })
        if (res.code === 1) {
          this.creditsLog = res.data.items || []
          this.creditsLogPagination.total = res.data.total || 0
        }
      } catch (e) {
        this.$message.error('Failed to load credits log')
      } finally {
        this.creditsLogLoading = false
      }
    },

    handleCreditsLogChange (pagination) {
      this.creditsLogPagination.current = pagination.current
      this.loadCreditsLog()
    },

    // Referral methods
    async loadReferrals () {
      this.referralLoading = true
      try {
        const res = await getMyReferrals({
          page: this.referralPagination.current,
          page_size: this.referralPagination.pageSize
        })
        if (res.code === 1) {
          this.referralData = {
            list: res.data.list || [],
            total: res.data.total || 0,
            referral_code: res.data.referral_code || '',
            referral_bonus: res.data.referral_bonus || 0,
            register_bonus: res.data.register_bonus || 0
          }
          this.referralPagination.total = res.data.total || 0
        }
      } catch (e) {
        this.$message.error('Failed to load referral data')
      } finally {
        this.referralLoading = false
      }
    },

    async loadReferralRewards () {
      try {
        const res = await getReferralRewards({ page: 1, page_size: 50 })
        if (res && res.code === 1) {
          this.rewardData = {
            ...this.rewardData,
            ...(res.data || {}),
            account: { ...this.rewardData.account, ...((res.data && res.data.account) || {}) },
            ledger: (res.data && res.data.ledger) || [],
            withdrawals: (res.data && res.data.withdrawals) || [],
            channels: (res.data && res.data.channels) || []
          }
        }
      } catch (e) {
        this.rewardData.enabled = false
      }
    },

    formatRewardAmount (value) {
      return Number(value || 0).toFixed(2)
    },

    formatRewardRate (value) {
      const rate = Number(value || 0)
      return Number.isInteger(rate) ? String(rate) : rate.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
    },

    getRewardStatusColor (status) {
      return {
        pending: 'orange',
        released: 'blue',
        posted: 'green',
        processing: 'blue',
        paid: 'green',
        rejected: 'red'
      }[status] || 'default'
    },

    getRewardStatusLabel (status) {
      const key = `profile.referralRewards.statusLabels.${status}`
      const translated = this.$t(key)
      return translated === key ? status : translated
    },

    getRewardActionLabel (action) {
      const key = `profile.referralRewards.actionLabels.${action}`
      const translated = this.$t(key)
      return translated === key ? action : translated
    },

    openRewardWithdrawal () {
      const first = this.rewardData.channels[0]
      this.rewardWithdrawal = {
        currency: first ? first.currency : '',
        chain: first ? first.code : '',
        address: '',
        amount: this.rewardData.minimum_withdrawal || null
      }
      this.rewardWithdrawalVisible = true
    },

    handleRewardWithdrawalCurrencyChange (currency) {
      const first = this.rewardData.channels.find(channel => channel.currency === currency)
      this.rewardWithdrawal.chain = first ? first.code : ''
    },

    async submitRewardWithdrawal () {
      const { currency, chain } = this.rewardWithdrawal
      if (!currency || !chain || !this.rewardWithdrawal.address || !this.rewardWithdrawal.amount) {
        this.$message.warning(this.$t('profile.referralRewards.completeFields'))
        return
      }
      this.rewardWithdrawalSubmitting = true
      try {
        const res = await createReferralWithdrawal({
          currency,
          chain,
          address: this.rewardWithdrawal.address,
          amount: this.rewardWithdrawal.amount
        })
        if (res && res.code === 1) {
          this.$message.success(this.$t('profile.referralRewards.submitted'))
          this.rewardWithdrawalVisible = false
          await this.loadReferralRewards()
        } else {
          this.$message.error((res && res.msg) || this.$t('profile.referralRewards.submitFailed'))
        }
      } catch (e) {
        const message = e && e.response && e.response.data && e.response.data.msg
        this.$message.error(message || this.$t('profile.referralRewards.submitFailed'))
      } finally {
        this.rewardWithdrawalSubmitting = false
      }
    },

    handleReferralChange (pagination) {
      this.referralPagination.current = pagination.current
      this.loadReferrals()
    },

    copyReferralLink () {
      const link = this.referralLink
      if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
          this.$message.success(this.$t('profile.referral.linkCopied') || '邀请链接已复制')
        }).catch(() => {
          this.fallbackCopy(link)
        })
      } else {
        this.fallbackCopy(link)
      }
    },

    copyText (text) {
      if (!text) return
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.$message.success(this.$t('common.copySuccess') || '复制成功')
        }).catch(() => {
          this.fallbackCopy(text)
        })
      } else {
        this.fallbackCopy(text)
      }
    },

    fallbackCopy (text) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        this.$message.success(this.$t('profile.referral.linkCopied') || '邀请链接已复制')
      } catch (err) {
        this.$message.error('Copy failed')
      }
      document.body.removeChild(textarea)
    },

    getActionColor (action) {
      // Map raw action codes to a preset color name (red / green / blue /
      // gold / cyan / purple / volcano / lime / orange). We avoid 'default'
      // because ant-design-vue treats it as a custom (non-preset) color
      // string, which renders an invalid background-color in light theme
      // and ends up white-on-white. Unknown actions fall back to 'blue'
      // so any new server-side action stays readable until we add a
      // proper mapping here.
      const colors = {
        consume: 'red',
        recharge: 'green',
        admin_adjust: 'blue',
        refund: 'orange',
        vip_grant: 'gold',
        vip_revoke: 'orange',
        register_bonus: 'cyan',
        referral_bonus: 'purple',
        // Membership
        membership_purchase: 'gold',
        membership_bonus: 'cyan',
        membership_monthly: 'lime',
        indicator_purchase: 'volcano',
        indicator_sale: 'lime'
      }
      return colors[action] || 'blue'
    },

    getActionLabel (action) {
      const labels = {
        consume: this.$t('profile.creditsLog.actionConsume') || '消费',
        recharge: this.$t('profile.creditsLog.actionRecharge') || '充值',
        admin_adjust: this.$t('profile.creditsLog.actionAdjust') || '调整',
        refund: this.$t('profile.creditsLog.actionRefund') || '退款',
        vip_grant: this.$t('profile.creditsLog.actionVipGrant') || 'VIP授予',
        vip_revoke: this.$t('profile.creditsLog.actionVipRevoke') || 'VIP取消',
        register_bonus: this.$t('profile.creditsLog.actionRegisterBonus') || '注册奖励',
        referral_bonus: this.$t('profile.creditsLog.actionReferralBonus') || '邀请奖励',
        // Membership (kept for historical rows; new purchases no longer
        // emit a separate `membership_purchase` row — see billing_service.)
        membership_purchase: this.$t('profile.creditsLog.actionMembershipPurchase') || '购买会员',
        membership_bonus: this.$t('profile.creditsLog.actionMembershipBonus') || '会员赠送积分',
        membership_monthly: this.$t('profile.creditsLog.actionMembershipMonthly') || '会员月度积分',
        indicator_purchase: this.$t('profile.creditsLog.actionIndicatorPurchase') || '购买指标',
        indicator_sale: this.$t('profile.creditsLog.actionIndicatorSale') || '出售指标'
      }
      return labels[action] || action
    },

    // Notification settings methods
    async loadNotificationSettings () {
      try {
        const res = await getNotificationSettings()
        if (res.code === 1 && res.data) {
          this.notificationSettings = {
            default_channels: normalizeNotificationChannels(res.data.default_channels),
            telegram_bot_token: res.data.telegram_bot_token || '',
            telegram_chat_id: res.data.telegram_chat_id || '',
            email: res.data.email || this.profile.email || '',
            phone: res.data.phone || '',
            discord_webhook: res.data.discord_webhook || '',
            webhook_url: res.data.webhook_url || '',
            webhook_token: res.data.webhook_token || '',
            webhook_signing_secret: res.data.webhook_signing_secret || ''
          }
          // Update form values
          this.$nextTick(() => {
            this.notificationForm.setFieldsValue({
              default_channels: this.notificationSettings.default_channels,
              telegram_bot_token: this.notificationSettings.telegram_bot_token,
              telegram_chat_id: this.notificationSettings.telegram_chat_id,
              email: this.notificationSettings.email,
              phone: this.notificationSettings.phone,
              discord_webhook: this.notificationSettings.discord_webhook,
              webhook_url: this.notificationSettings.webhook_url,
              webhook_token: this.notificationSettings.webhook_token,
              webhook_signing_secret: this.notificationSettings.webhook_signing_secret
            })
          })
        }
      } catch (e) {
        // Use default values
      }
    },

    _mapNotifyTestError (channel, err) {
      const e = (err || '').trim()
      if (channel === 'email') {
        if (e === 'missing_SMTP_HOST') {
          return this.$t('profile.notifications.errSmtpHost') ||
            'email：服务器未配置发信 SMTP（管理员在「系统设置 → 邮件」或环境变量 SMTP_HOST/SMTP_USER 等）'
        }
        if (e === 'missing_SMTP_FROM') {
          return this.$t('profile.notifications.errSmtpFrom') ||
            'email：未配置发件人 SMTP_FROM（或 SMTP_USER）'
        }
        if (e === 'missing_email_target') {
          return this.$t('profile.notifications.errEmailTarget') ||
            'email：未填写通知邮箱且账号无邮箱'
        }
      }
      return e ? `${channel}: ${e}` : ''
    },

    // Keep our reactive ``notificationSettings.webhook_url`` in sync with
    // what the user is currently typing so the dialect badge updates
    // live (the form decorator owns the actual value, but the computed
    // properties read from notificationSettings).
    handleWebhookUrlChange (e) {
      const v = (e && e.target && typeof e.target.value !== 'undefined') ? e.target.value : ''
      this.notificationSettings.webhook_url = v || ''
    },

    handleSaveNotifications () {
      this.notificationForm.validateFields(async (err, values) => {
        if (err) return

        this.savingNotifications = true
        try {
          const res = await updateNotificationSettings({
            default_channels: normalizeNotificationChannels(values.default_channels),
            telegram_bot_token: values.telegram_bot_token || '',
            telegram_chat_id: values.telegram_chat_id || '',
            email: values.email || '',
            phone: values.phone || '',
            discord_webhook: values.discord_webhook || '',
            webhook_url: values.webhook_url || '',
            webhook_token: values.webhook_token || '',
            webhook_signing_secret: values.webhook_signing_secret || ''
          })
          if (res.code === 1) {
            this.$message.success(this.$t('profile.notifications.saveSuccess') || '通知设置保存成功')
            this.notificationSettings = res.data || this.notificationSettings
          } else {
            this.$message.error(res.msg || '保存失败')
          }
        } catch (e) {
          this.$message.error('保存失败')
        } finally {
          this.savingNotifications = false
        }
      })
    },

    async handleTestNotification () {
      const values = this.notificationForm.getFieldsValue()
      const channels = values.default_channels || []

      if (channels.length === 0) {
        this.$message.warning(this.$t('profile.notifications.selectChannel') || '请至少选择一个通知渠道')
        return
      }

      // Check if required fields are filled
      if (channels.includes('telegram')) {
        if (!values.telegram_bot_token) {
          this.$message.warning(this.$t('profile.notifications.fillTelegramToken') || '请填写 Telegram Bot Token')
          return
        }
        if (!values.telegram_chat_id) {
          this.$message.warning(this.$t('profile.notifications.fillTelegram') || '请填写 Telegram Chat ID')
          return
        }
      }
      if (channels.includes('email') && !values.email) {
        this.$message.warning(this.$t('profile.notifications.fillEmail') || '请填写通知邮箱')
        return
      }
      if (channels.includes('phone') && !values.phone) {
        this.$message.warning(this.$t('profile.notifications.fillPhone') || '请填写手机号')
        return
      }
      if (channels.includes('discord') && !values.discord_webhook) {
        this.$message.warning(this.$t('profile.notifications.fillDiscord') || '请填写 Discord Webhook URL')
        return
      }
      if (channels.includes('webhook') && !values.webhook_url) {
        this.$message.warning(this.$t('profile.notifications.fillWebhook') || '请填写 Webhook URL')
        return
      }

      this.testingNotification = true
      try {
        const saveRes = await updateNotificationSettings({
          default_channels: channels,
          telegram_bot_token: values.telegram_bot_token || '',
          telegram_chat_id: values.telegram_chat_id || '',
          email: values.email || '',
          phone: values.phone || '',
          discord_webhook: values.discord_webhook || '',
          webhook_url: values.webhook_url || '',
          webhook_token: values.webhook_token || ''
        })

        if (saveRes.code !== 1) {
          this.$message.error(saveRes.msg || '保存设置失败')
          return
        }

        const testRes = await testNotificationSettings()
        if (testRes.code !== 1) {
          this.$message.error(testRes.msg || (this.$t('profile.notifications.testFailed') || '测试通知发送失败'))
          return
        }

        const results = (testRes.data && testRes.data.results) || {}
        const failed = Object.keys(results).filter((k) => !results[k].ok)
        if (failed.length === 0) {
          this.$message.success(this.$t('profile.notifications.testSent') || '测试通知已发送，请检查各渠道')
        } else {
          const detail = failed.map((k) => {
            const err = (results[k] && results[k].error) || ''
            const hint = this._mapNotifyTestError(k, err)
            return hint || (err ? `${k}: ${err}` : k)
          }).join('；')
          this.$message.warning(
            (this.$t('profile.notifications.testPartial') || '部分渠道发送失败') + ` — ${detail}`,
            8
          )
        }
      } catch (e) {
        this.$message.error(this.$t('profile.notifications.testFailed') || '发送测试通知失败')
      } finally {
        this.testingNotification = false
      }
    }
  }
}
</script>

<style lang="less" scoped>
@primary-color: var(--primary-color, #1890ff);

.profile-page {
  padding: 24px 28px 36px !important;
  min-height: calc(100vh - 120px);
  background: var(--qd-bg, #f3f5f7);

  .page-header {
    margin-bottom: 28px;

    .page-title {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 10px 0;
      color: var(--qd-text, #1c2430);
      display: flex;
      align-items: center;
      gap: 12px;

      .anticon {
        font-size: 28px;
        color: @primary-color;
      }
    }

    .page-desc {
      color: var(--qd-text-secondary, #5d6b7a);
      font-size: 14px;
      margin: 0;
    }
  }

  // Profile cards row - make cards same height
  .profile-cards-row {
    display: flex;
    align-items: stretch;

    .profile-card-col,
    .right-cards-col {
      display: flex;
      flex-direction: column;

      .ant-card {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      ::v-deep .ant-card-body {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
    }

    .right-cards-row {
      height: 100%;
      display: flex;

      .ant-col {
        display: flex;
        flex-direction: column;

        .ant-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        ::v-deep .ant-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
      }
    }
  }

  .profile-card {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    text-align: center;

    .avatar-section {
      padding: 20px 0;

      .ant-avatar {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .username {
        margin: 16px 0 8px;
        font-size: 20px;
        font-weight: 600;
        color: #1e3a5f;
      }

      .user-role {
        margin: 0;
      }
    }

    .profile-info {
      text-align: left;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-around;

      .info-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .anticon {
          font-size: 16px;
          color: @primary-color;
          margin-right: 12px;
        }

        .label {
          color: #64748b;
          margin-right: 8px;
        }

        .value {
          color: #1e3a5f;
          font-weight: 500;
        }
      }
    }

    .profile-account-meta {
      display: flex !important;
      flex-direction: column;
      align-items: flex-start !important;
      justify-content: flex-start !important;
      width: 100% !important;
      max-width: none !important;
      margin: 8px 0 0 !important;
      padding: 0 !important;
      text-align: left !important;

      .info-item {
        display: flex !important;
        align-items: center;
        justify-content: flex-start !important;
        width: 100% !important;
        min-height: 34px;
        padding: 5px 0;
        border: 0;
        text-align: left !important;

        .anticon {
          flex: 0 0 18px;
          margin: 0 8px 0 0 !important;
          color: var(--primary-color, #1890ff);
          font-size: 14px;
        }

        .label {
          flex: 0 0 86px;
          margin: 0 !important;
          color: var(--qd-text-muted);
          font-size: 12px;
        }

        .value {
          flex: 0 1 220px;
          overflow: hidden;
          color: var(--qd-text);
          font-size: 12px;
          font-weight: 600;
          text-align: left !important;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .edit-card {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

    ::v-deep .ant-tabs-bar {
      margin-bottom: 22px;
      border-bottom-color: #edf2f7;
    }

    ::v-deep .ant-tabs-nav-wrap {
      padding: 0 4px;
    }

    ::v-deep .ant-tabs-tab {
      height: 40px;
      min-width: 104px;
      margin-right: 4px;
      padding: 0 14px;
      border-radius: 8px 8px 0 0;
      color: #64748b;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease, background 0.2s ease;

      &:hover {
        color: var(--primary-color, @primary-color);
        background: color-mix(in srgb, var(--primary-color, @primary-color) 7%, #fff);
      }

      .anticon {
        margin-right: 6px;
      }
    }

    ::v-deep .ant-tabs-tab-active {
      color: var(--primary-color, @primary-color);
      background: color-mix(in srgb, var(--primary-color, @primary-color) 10%, #fff);
      font-weight: 700;
    }

    ::v-deep .ant-tabs-ink-bar {
      height: 3px;
      border-radius: 999px;
      background: var(--primary-color, @primary-color);
    }

    .profile-form {
      max-width: 500px;

      ::v-deep .ant-input,
      ::v-deep .ant-input-password {
        border-radius: 8px;
      }

      .email-hint {
        margin-top: 8px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.45);

        &.email-warning {
          color: #faad14;
        }
      }

      .account-center-hint {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin: 0 0 20px;
        padding: 12px 14px;
        border: 1px solid var(--qd-border, #e4e9ef);
        background: var(--qd-surface-subtle, #f6f8fa);
      }

      .account-center-hint-copy {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;

        strong {
          color: var(--qd-text, #1c2430);
          font-size: 13px;
        }

        span {
          color: var(--qd-text-secondary, #5d6b7a);
          font-size: 12px;
          line-height: 1.5;
        }
      }
    }

    // Credits log amount colors
    .amount-positive {
      color: #52c41a;
      font-weight: 600;
    }

    .amount-negative {
      color: #ff4d4f;
      font-weight: 600;
    }

    // Notification settings form
    .notification-settings-form {
      .field-hint {
        margin-top: 6px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        gap: 4px;

        .anticon {
          font-size: 12px;
        }
      }

      // Live "detected dialect" badge under the webhook URL input.
      // Sits on the same row as a hint string so users see at a glance
      // that the system understood their URL and won't fall back to
      // the generic JSON envelope (which Feishu et al would reject).
      .webhook-dialect {
        margin-top: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .ant-tag { margin: 0; }
        &__hint {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.55);
        }
      }

      ::v-deep .ant-checkbox-group {
        width: 100%;
      }

      ::v-deep .ant-checkbox-wrapper {
        width: 100%;
        min-height: 42px;
        margin-bottom: 8px;
        padding: 10px 12px;
        border: 1px solid #e6ebf2;
        border-radius: 8px;
        background: #fbfdff;
        display: inline-flex;
        align-items: center;
        transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;

        &:hover {
          border-color: color-mix(in srgb, var(--primary-color, #1890ff) 44%, #e6ebf2);
          background: color-mix(in srgb, var(--primary-color, #1890ff) 6%, #fff);
        }

        .anticon {
          margin: 0 6px 0 2px;
          color: var(--primary-color, #1890ff);
        }
      }

      ::v-deep .ant-checkbox-wrapper-checked {
        border-color: color-mix(in srgb, var(--primary-color, #1890ff) 56%, #e6ebf2);
        background: color-mix(in srgb, var(--primary-color, #1890ff) 10%, #fff);
        box-shadow: 0 8px 20px color-mix(in srgb, var(--primary-color, #1890ff) 12%, transparent);
      }
    }
  }

  .credits-card {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    background: linear-gradient(135deg, color-mix(in srgb, var(--primary-color, #0f9ea8) 88%, #0a6b72) 0%, color-mix(in srgb, var(--primary-color, #0f9ea8) 55%, #1a3a3c) 100%);
    color: #fff;

    ::v-deep .ant-card-body {
      background: transparent;
      display: flex;
      flex-direction: column;
    }

    ::v-deep .ant-divider {
      border-color: rgba(255, 255, 255, 0.2);
    }

    .credits-header {
      .credits-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 8px;

        .anticon {
          font-size: 18px;
        }
      }
    }

    .credits-body {
      padding: 20px 0;
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .credits-amount {
        .amount-value {
          font-size: 42px;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .amount-label {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          margin-left: 8px;
        }
      }

      .vip-status {
        margin-top: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 13px;

        .vip-active {
          color: #ffd700;
        }

        .vip-expired {
          color: rgba(255, 255, 255, 0.6);
        }

        .no-vip {
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }

    .credits-actions {
      text-align: center;
      margin-top: auto;

      .ant-btn {
        border-radius: 20px;
        padding: 0 24px;
        height: 36px;
        font-weight: 700;
        background: #fff;
        color: #3f2f8f;
        border: 1px solid rgba(255, 255, 255, 0.92);
        box-shadow: 0 8px 20px rgba(26, 18, 75, 0.22);

        &:hover {
          background: #f8fbff;
          color: #251464;
          border-color: #fff;
          box-shadow: 0 10px 24px rgba(26, 18, 75, 0.28);
        }
      }
    }

    .credits-hint {
      margin-top: 12px;
      text-align: center;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
  }

  .referral-card {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: #fff;

    ::v-deep .ant-card-body {
      background: transparent;
      display: flex;
      flex-direction: column;
    }

    ::v-deep .ant-divider {
      border-color: rgba(255, 255, 255, 0.2);
    }

    .referral-header {
      .referral-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 8px;

        .anticon {
          font-size: 18px;
        }
      }
    }

    .referral-body {
      padding: 12px 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .referral-stats {
        display: flex;
        justify-content: space-around;

        .stat-item {
          text-align: center;

          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #fff;
            display: block;
          }

          .stat-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
          }
        }
      }

      .referral-link-section {
        .link-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 6px;
        }

        .link-box {
          ::v-deep .ant-input {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: #fff;

            &::placeholder {
              color: rgba(255, 255, 255, 0.6);
            }
          }

          ::v-deep .anticon-copy {
            color: #fff;

            &:hover {
              color: #ffd700;
            }
          }
        }
      }

      .referral-hint {
        margin-top: auto;
        text-align: center;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;

        .anticon-gift {
          color: #ffd700;
        }
      }
    }
  }

  // Referral user cell in table
  .referral-user-cell {
    display: flex;
    align-items: center;
    gap: 10px;

    .user-info {
      display: flex;
      flex-direction: column;

      .nickname {
        font-weight: 500;
        color: #333;
      }

      .username {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .test-result-msg {
    margin-top: 8px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    &.success {
      color: #52c41a;
    }
    &.error {
      color: #f5222d;
    }
  }

  // Dark theme — align with workspace cool shell tokens (--qd-*), not warm #141414 greys.
  &.theme-dark {
    background: transparent;
    color: var(--qd-text);

    .page-header {
      .page-title {
        color: var(--qd-text);
      }
      .page-desc {
        color: var(--qd-text-secondary);
      }
    }

    .profile-card,
    .edit-card,
    .credits-card,
    .referral-card {
      background: var(--qd-surface);
      border: 1px solid var(--qd-border);
      box-shadow: none;
      color: var(--qd-text);

      ::v-deep .ant-card-body {
        background: transparent;
      }
    }

    .profile-card {
      .avatar-section .username,
      .username {
        color: var(--qd-text);
      }

      .default-avatar img {
        background: #243040;
      }

      .profile-identity {
        border-bottom-color: var(--qd-border);
      }

      .profile-info,
      .profile-account-meta {
        .info-item {
          border-bottom-color: var(--qd-border);

          .label {
            color: var(--qd-text-muted);
          }

          .value {
            color: var(--qd-text);
          }
        }
      }
    }

    .edit-card {
      ::v-deep .ant-tabs-bar {
        border-bottom-color: var(--qd-border);
      }

      ::v-deep .ant-tabs-tab {
        color: var(--qd-text-secondary);

        &:hover {
          color: var(--primary-color, @primary-color);
          background: color-mix(in srgb, var(--primary-color, @primary-color) 12%, var(--qd-surface));
        }
      }

      ::v-deep .ant-tabs-tab-active {
        color: var(--primary-color, @primary-color);
        background: color-mix(in srgb, var(--primary-color, @primary-color) 14%, var(--qd-surface));
      }

      ::v-deep .ant-form-item-label label {
        color: var(--qd-text-secondary);
      }

      ::v-deep .ant-input,
      ::v-deep .ant-input-password,
      ::v-deep .ant-input-affix-wrapper {
        background: var(--qd-surface-subtle);
        border-color: var(--qd-border);
        color: var(--qd-text);

        &:hover,
        &:focus,
        &-focused {
          border-color: var(--primary-color, @primary-color);
        }
      }
    }

    .credits-card {
      background: var(--qd-surface);
      color: var(--qd-text);

      ::v-deep .ant-divider {
        border-color: var(--qd-border);
      }

      .credits-title,
      .amount-value {
        color: var(--qd-text) !important;
        text-shadow: none;
      }

      .amount-label,
      .no-vip,
      .vip-expired,
      .credits-hint {
        color: var(--qd-text-muted) !important;
      }

      .credits-actions .ant-btn,
      .credits-recharge-btn {
        background: color-mix(in srgb, var(--primary-color, @primary-color) 14%, var(--qd-surface));
        color: var(--primary-color, @primary-color);
        border: 1px solid color-mix(in srgb, var(--primary-color, @primary-color) 42%, var(--qd-border));
        box-shadow: none;

        &:hover {
          background: color-mix(in srgb, var(--primary-color, @primary-color) 22%, var(--qd-surface));
          color: var(--primary-color, @primary-color);
          border-color: var(--primary-color, @primary-color);
        }
      }
    }

    .referral-card {
      .referral-title,
      .referral-mini-stat strong {
        color: var(--qd-text);
      }

      .link-label,
      .referral-mini-stat span,
      .referral-benefit {
        color: var(--qd-text-muted);
      }

      .link-box ::v-deep .ant-input {
        background: var(--qd-surface-subtle);
        border-color: var(--qd-border);
        color: var(--qd-text);
      }
    }

    ::v-deep .ant-table-wrapper {
      .ant-table {
        background: var(--qd-surface);
        color: var(--qd-text);
      }

      .ant-table-thead > tr > th {
        background: var(--qd-surface-subtle);
        color: var(--qd-text-secondary);
        border-bottom-color: var(--qd-border);
      }

      .ant-table-tbody > tr > td {
        background: var(--qd-surface);
        color: var(--qd-text);
        border-bottom-color: var(--qd-border);
      }

      .ant-table-tbody > tr:hover > td {
        background: var(--qd-surface-subtle);
      }

      .ant-table-placeholder {
        background: var(--qd-surface);
        color: var(--qd-text-muted);
      }

      .ant-table-tbody > tr > td,
      .ant-table-tbody > tr > td span,
      .ant-table-tbody > tr > td div,
      .ant-table-tbody > tr > td *:not(.ant-tag):not(.ant-btn) {
        color: var(--qd-text);
      }

      .amount-positive {
        color: #73d13d;
      }

      .amount-negative {
        color: #ff7875;
      }

      .ant-tag {
        border-width: 1px;
        font-weight: 600;
      }
      .ant-tag-red { background: rgba(245,34,45,0.22); border-color: #f5222d; color: #ff7875; }
      .ant-tag-green { background: rgba(82,196,26,0.22); border-color: #52c41a; color: #73d13d; }
      .ant-tag-blue {
        background: color-mix(in srgb, var(--primary-color, #1890ff) 22%, transparent);
        border-color: var(--primary-color, #1890ff);
        color: var(--primary-color-hover, var(--primary-color, #1890ff));
      }
      .ant-tag-orange { background: rgba(250,173,20,0.22); border-color: #faad14; color: #ffc53d; }
      .ant-tag-gold { background: rgba(250,173,20,0.22); border-color: #faad14; color: #ffc53d; }
      .ant-tag-cyan { background: rgba(19,194,194,0.22); border-color: #13c2c2; color: #5cdbd3; }
      .ant-tag-purple { background: rgba(114,46,209,0.22); border-color: #722ed1; color: #b37feb; }
      .ant-tag-volcano { background: rgba(250,84,28,0.22); border-color: #fa541c; color: #ff9c6e; }
      .ant-tag-lime { background: rgba(160,212,104,0.22); border-color: #a0d911; color: #bae637; }
      .ant-tag-default { background: rgba(255,255,255,0.06); border-color: var(--qd-border); color: var(--qd-text-secondary); }
    }

    .profile-form,
    .notification-settings-form {
      ::v-deep .ant-form-item-label > label {
        color: var(--qd-text-secondary);
      }

      ::v-deep .ant-form-item-explain,
      ::v-deep .ant-form-item-extra {
        color: var(--qd-text-muted);
      }

      ::v-deep .ant-input,
      ::v-deep .ant-input-password,
      ::v-deep .ant-input-affix-wrapper,
      ::v-deep .ant-select-selection,
      ::v-deep .ant-select-selector,
      ::v-deep .ant-input-number {
        background: var(--qd-surface-subtle) !important;
        border-color: var(--qd-border) !important;
        color: var(--qd-text) !important;

        &::placeholder {
          color: var(--qd-text-muted);
        }
      }

      ::v-deep .ant-select-selection-item,
      ::v-deep .ant-select-selection-placeholder,
      ::v-deep .ant-select-selection-selected-value {
        color: var(--qd-text);
      }

      ::v-deep .ant-checkbox-wrapper,
      ::v-deep .ant-radio-wrapper {
        color: var(--qd-text);

        span {
          color: var(--qd-text);
        }
      }

      ::v-deep .ant-checkbox-checked .ant-checkbox-inner,
      ::v-deep .ant-radio-checked .ant-radio-inner {
        background-color: @primary-color;
        border-color: @primary-color;
      }

      .email-hint,
      .field-hint {
        color: var(--qd-text-muted);
      }

      .email-warning {
        color: #ff7875;
      }

      .account-center-hint {
        border-color: var(--qd-border);
        background: color-mix(in srgb, var(--primary-color, @primary-color) 8%, var(--qd-surface-subtle));
      }

      ::v-deep .ant-checkbox-wrapper {
        border-color: var(--qd-border);
        background: var(--qd-surface-subtle);

        &:hover {
          border-color: color-mix(in srgb, var(--primary-color, #1890ff) 48%, var(--qd-border));
          background: color-mix(in srgb, var(--primary-color, #1890ff) 8%, var(--qd-surface-subtle));
        }
      }

      ::v-deep .ant-checkbox-wrapper-checked {
        border-color: color-mix(in srgb, var(--primary-color, #1890ff) 55%, var(--qd-border));
        background: color-mix(in srgb, var(--primary-color, #1890ff) 14%, var(--qd-surface-subtle));
        box-shadow: none;
      }
    }

    .notification-settings-form {
      ::v-deep .ant-alert {
        background: var(--qd-surface-subtle);
        border-color: var(--qd-border);
        color: var(--qd-text);

        .ant-alert-message {
          color: var(--qd-text);
        }

        .ant-alert-description {
          color: var(--qd-text-muted);
        }
      }
    }

    .test-result-msg {
      &.success {
        color: #73d13d;
      }
      &.error {
        color: #ff7875;
      }
    }

    .referral-user-cell {
      .user-info {
        .nickname {
          color: var(--qd-text);
        }

        .username {
          color: var(--qd-text-muted);
        }
      }
    }

    // Preset Ant tags keep their hue; soften them for dark chrome instead of
    // forcing muted grey on a washed light pink (admin looked broken).
    ::v-deep .ant-tag:not([color]):not(.ant-tag-has-color) {
      color: var(--qd-text-secondary);
    }

    ::v-deep .ant-tag.ant-tag-has-color {
      color: #ffffff !important;
      border-color: transparent !important;
    }

    ::v-deep .ant-tag-red {
      background: rgba(245, 34, 45, 0.16) !important;
      border-color: rgba(255, 120, 117, 0.42) !important;
      color: #ff9c9c !important;
    }

    ::v-deep .ant-tag-orange {
      background: rgba(250, 173, 20, 0.16) !important;
      border-color: rgba(255, 197, 61, 0.42) !important;
      color: #ffc53d !important;
    }

    ::v-deep .ant-tag-blue {
      background: color-mix(in srgb, var(--primary-color, #0f9ea8) 18%, transparent) !important;
      border-color: color-mix(in srgb, var(--primary-color, #0f9ea8) 45%, transparent) !important;
      color: var(--primary-color, #2ecfcf) !important;
    }

    ::v-deep .ant-tag-gold {
      background: rgba(250, 173, 20, 0.16) !important;
      border-color: rgba(255, 197, 61, 0.42) !important;
      color: #ffc53d !important;
    }

    ::v-deep .ant-tag-default {
      background: rgba(255, 255, 255, 0.06) !important;
      border-color: var(--qd-border) !important;
      color: var(--qd-text-secondary) !important;
    }

    .user-role ::v-deep .ant-tag {
      margin: 0;
      padding: 0 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      line-height: 20px;
    }

    ::v-deep .ant-input-prefix .anticon,
    ::v-deep .ant-input-suffix .anticon,
    ::v-deep .field-hint .anticon,
    ::v-deep .email-hint .anticon,
    ::v-deep .credits-hint .anticon,
    ::v-deep .notification-settings-form .anticon {
      color: var(--qd-text-muted) !important;
    }

    ::v-deep .ant-pagination {
      .ant-pagination-item {
        background: var(--qd-surface);
        border-color: var(--qd-border);

        a {
          color: var(--qd-text-secondary);
        }

        &:hover {
          border-color: @primary-color;
        }
      }

      .ant-pagination-item-active {
        background: @primary-color;
        border-color: @primary-color;

        a {
          color: var(--primary-on-color, #fff);
        }
      }

      .ant-pagination-prev,
      .ant-pagination-next {
        .ant-pagination-item-link {
          background: var(--qd-surface);
          border-color: var(--qd-border);
          color: var(--qd-text-secondary);
        }
      }

      .ant-pagination-options {
        .ant-select-selector,
        .ant-select-selection {
          background: var(--qd-surface-subtle);
          border-color: var(--qd-border);
          color: var(--qd-text);
        }
      }
    }

    ::v-deep .ant-btn {
      &.ant-btn-default {
        background: var(--qd-surface-subtle);
        border-color: var(--qd-border);
        color: var(--qd-text);

        &:hover {
          border-color: @primary-color;
          color: @primary-color;
        }
      }
    }
  }
}

/* Compact account overview and task-oriented settings navigation. */
.profile-page {
  .profile-overview-grid {
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(280px, 0.82fr) minmax(360px, 1.12fr);
    gap: 20px;
    margin-bottom: 24px;

    > .ant-card {
      min-width: 0;
      min-height: 210px;
      border: 1px solid var(--qd-border);
      border-radius: 8px;
      background: var(--qd-surface);
      color: var(--qd-text);
      box-shadow: none;

      ::v-deep .ant-card-body {
        height: 100%;
        padding: 20px;
        background: transparent;
      }
    }
  }

  .profile-card {
    text-align: left;

    ::v-deep .ant-card-body {
      display: block;
      width: 100%;
      text-align: left;
    }

    .profile-identity {
      display: flex;
      align-items: center;
      gap: 18px;
      min-height: 120px;
      padding: 8px 0 20px;
      border-bottom: 1px solid var(--qd-border);

      .avatar-editor {
        flex: 0 0 auto;
      }

      .avatar-hitbox {
        position: relative;
        width: 96px;
        height: 96px;
        overflow: hidden;
        border-radius: 50%;
        cursor: pointer;

        &.uploading {
          pointer-events: none;
          opacity: 0.72;
        }
      }

      .ant-avatar {
        flex: 0 0 96px;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color, #1890ff) 12%, transparent);
      }

      .avatar-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: #fff;
        background: rgba(15, 23, 42, 0.55);
        font-size: 12px;
        line-height: 1.2;
        opacity: 0;
        transition: opacity 0.16s ease;
        pointer-events: none;

        .anticon {
          font-size: 18px;
        }
      }

      .avatar-hitbox:hover .avatar-overlay,
      .avatar-hitbox.uploading .avatar-overlay {
        opacity: 1;
      }

      // The bundled avatar is a transparent PNG with the wordmark drawn in the
      // light-theme accent, so it vanishes against a dark surface. This class
      // is applied only when no photo was uploaded, so a user's own picture is
      // never given a plate behind it.
      .default-avatar img {
        background: #f4f4f2;
      }
    }

    .profile-identity-copy {
      min-width: 0;
    }

    .account-center-btn {
      margin-top: 10px;
    }

    .username {
      overflow: hidden;
      margin: 0 0 8px;
      color: var(--qd-text);
      font-size: 20px;
      font-weight: 700;
      line-height: 1.35;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-role {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .ant-tag {
        margin: 0;
      }
    }

    .profile-info {
      display: grid;
      align-self: stretch;
      width: 100% !important;
      max-width: none !important;
      gap: 0;
      margin: 8px 0 0 !important;
      justify-self: stretch;
      text-align: left;

      .info-item {
        display: grid;
        grid-template-columns: 18px 86px minmax(0, 220px);
        align-items: center;
        justify-content: start;
        gap: 8px;
        min-height: 34px;
        padding: 5px 0;
        border: 0;

        .anticon {
          margin: 0;
          color: var(--primary-color, #1890ff);
          font-size: 14px;
        }

        .label {
          margin: 0;
          color: var(--qd-text-muted);
          font-size: 12px;
        }

        .value {
          overflow: hidden;
          color: var(--qd-text);
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .profile-overview-grid .credits-card,
  .profile-overview-grid .referral-card {
    background: var(--qd-surface);
    color: var(--qd-text);

    .credits-title,
    .referral-title {
      margin: 0;
      color: var(--qd-text);
      font-size: 13px;
      font-weight: 700;
    }
  }

  .profile-overview-grid .credits-card {
    .credits-body {
      align-items: flex-start;
      justify-content: center;
      padding: 16px 0 12px;
      text-align: left;
    }

    .credits-amount {
      display: flex;
      align-items: baseline;
      gap: 7px;

      .amount-value {
        color: var(--qd-text);
        font-size: 32px;
        font-weight: 750;
        line-height: 1.15;
        text-shadow: none;
      }

      .amount-label {
        margin: 0;
        color: var(--qd-text-muted);
        font-size: 12px;
      }
    }

    .vip-status {
      justify-content: flex-start;
      margin-top: 8px;

      .no-vip,
      .vip-expired {
        color: var(--qd-text-muted);
      }
    }

    .credits-footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--qd-border);
    }

    .credits-hint {
      justify-content: flex-start;
      min-width: 0;
      margin: 0;
      color: var(--qd-text-muted);
      text-align: left;
    }

    .credits-recharge-btn {
      flex: 0 0 auto;
      height: 32px;
      padding: 0 13px;
      border: 1px solid color-mix(in srgb, var(--primary-color, #1890ff) 45%, var(--qd-border));
      border-radius: 6px;
      background: color-mix(in srgb, var(--primary-color, #1890ff) 10%, var(--qd-surface));
      box-shadow: none;
      color: var(--primary-color, #1890ff);
    }
  }

  .profile-overview-grid .referral-card {
    .referral-card-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .referral-title {
      display: flex;
      align-items: center;
      gap: 7px;
      padding-top: 2px;

      .anticon { color: var(--primary-color, #1890ff); }
    }

    .referral-mini-stats {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .referral-mini-stat {
      display: flex;
      align-items: baseline;
      gap: 5px;
      white-space: nowrap;

      strong {
        color: var(--qd-text);
        font-size: 18px;
        line-height: 1;
      }

      span {
        color: var(--qd-text-muted);
        font-size: 11px;
      }
    }

    .referral-body {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 9px;
      padding: 12px 0 0;
    }

    .referral-link-section {
      min-width: 0;

      .link-label {
        color: var(--qd-text-muted);
      }

      .link-box ::v-deep .ant-input {
        border-color: var(--qd-border);
        background: var(--qd-surface-subtle);
        color: var(--qd-text);
      }

      .link-box ::v-deep .anticon-copy {
        color: var(--primary-color, #1890ff);
      }
    }

    .referral-benefits {
      display: grid;
      gap: 4px;
      min-height: 22px;
    }

    .referral-benefit {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--qd-text-muted);
      font-size: 11px;
      line-height: 1.4;

      .anticon { color: #d89614; }
    }

    .referral-benefit-membership .anticon {
      color: var(--primary-color, #1890ff);
    }
  }

  .profile-settings-shell {
    min-width: 0;
  }

  .profile-settings-shell .edit-card {
    overflow: hidden;
    border: 1px solid var(--qd-border);
    border-radius: 8px;
    background: var(--qd-surface);
    box-shadow: none;

    ::v-deep > .ant-card-body {
      padding: 0;
    }

    ::v-deep .ant-tabs-left-bar {
      width: 196px;
      min-height: 560px;
      margin: 0;
      padding: 12px 8px;
      border-right: 1px solid var(--qd-border);
      background: var(--qd-surface-subtle);
    }

    ::v-deep .ant-tabs-left-bar .ant-tabs-nav-container,
    ::v-deep .ant-tabs-left-bar .ant-tabs-nav-wrap,
    ::v-deep .ant-tabs-left-bar .ant-tabs-nav-scroll,
    ::v-deep .ant-tabs-left-bar .ant-tabs-nav {
      width: 100%;
      height: auto !important;
    }

    ::v-deep .ant-tabs-left-bar .ant-tabs-nav {
      display: block;
      float: none;
      white-space: normal;
    }

    ::v-deep .ant-tabs-left-bar .ant-tabs-tab {
      display: flex !important;
      justify-content: flex-start;
      width: 100%;
      height: 38px;
      min-width: 0;
      margin: 0 0 4px;
      padding: 0 12px;
      border-radius: 6px;
      color: var(--qd-text-secondary);
      text-align: left;
    }

    ::v-deep .ant-tabs-left-bar .ant-tabs-tab-active {
      background: color-mix(in srgb, var(--primary-color, #1890ff) 11%, var(--qd-surface));
      color: var(--primary-color, #1890ff);
    }

    ::v-deep .ant-tabs-left-bar .ant-tabs-ink-bar {
      display: none !important;
    }

    ::v-deep .ant-tabs-left-content {
      min-height: 560px;
      padding: 20px 24px 24px;
      border: 0;
    }

    ::v-deep .ant-tabs-tab .anticon {
      width: 16px;
      margin-right: 9px;
      font-size: 14px;
      text-align: center;
    }

    .profile-form {
      width: 100%;
      max-width: 640px;
    }

    .notification-settings-form {
      max-width: 780px;
    }

    .notification-settings-fields {
      width: 100%;
      max-width: 780px;
    }

    .notification-field-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;

      .anticon {
        color: var(--primary-color, #1890ff) !important;
        font-size: 13px;
      }
    }

    .notification-fields-grid {
      display: block;
      width: 100%;
      padding-top: 4px;

      ::v-deep .ant-form-item {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 0 20px !important;
      }

      ::v-deep .ant-form-item-label,
      ::v-deep .ant-form-item-control-wrapper,
      ::v-deep .ant-form-item-control,
      ::v-deep .ant-input-affix-wrapper,
      ::v-deep .ant-input {
        width: 100% !important;
        max-width: none !important;
        float: none !important;
      }

      .field-hint {
        align-items: flex-start;
        max-width: 100%;
        margin-top: 7px;
        line-height: 1.55;
        overflow-wrap: anywhere;
      }
    }

    .notification-form-actions {
      margin-top: 4px;
      padding-top: 16px;
      border-top: 1px solid var(--qd-border);
    }
  }

  &.theme-dark {
    .profile-overview-grid > .ant-card,
    .profile-settings-shell .edit-card {
      border-color: var(--qd-border);
      background: var(--qd-surface);
      color: var(--qd-text);
      box-shadow: none;
    }

    .profile-settings-shell .edit-card {
      ::v-deep .ant-tabs-left-bar {
        border-right-color: var(--qd-border);
        background: color-mix(in srgb, var(--qd-surface-subtle) 88%, #0e151c);
      }

      ::v-deep .ant-tabs-left-bar .ant-tabs-tab {
        color: var(--qd-text-secondary);

        &:hover {
          color: var(--qd-text);
          background: color-mix(in srgb, var(--primary-color, #1890ff) 8%, transparent);
        }
      }

      ::v-deep .ant-tabs-left-bar .ant-tabs-tab-active {
        background: color-mix(in srgb, var(--primary-color, #1890ff) 14%, var(--qd-surface));
        color: var(--primary-color, #1890ff);
      }

      ::v-deep .ant-tabs-left-content {
        background: var(--qd-surface);
      }
    }
  }
}

@media screen and (max-width: 1280px) {
  .profile-page {
    .profile-overview-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));

      .referral-card {
        grid-column: 1 / -1;
      }
    }
  }
}

@media screen and (max-width: 960px) {
  .profile-page {
    .profile-settings-shell .edit-card {
      ::v-deep .ant-tabs-top-bar {
        margin: 0;
        padding: 0 12px;
        border-bottom: 1px solid var(--qd-border);
        background: var(--qd-surface-subtle);
      }

      ::v-deep .ant-tabs-top-content {
        padding: 18px;
      }

      .notification-fields-grid {
        display: block;
      }
    }
  }
}

// ==================== Mobile Responsive Styles ====================
@media screen and (max-width: 768px) {
  .profile-page {
    padding: 12px;

    .profile-overview-grid {
      grid-template-columns: minmax(0, 1fr);

      .referral-card {
        grid-column: auto;
      }

      > .ant-card {
        min-height: 0;
      }
    }

    .profile-overview-grid .referral-card .referral-body {
      grid-template-columns: minmax(0, 1fr);
    }

    .page-header {
      margin-bottom: 16px;

      .page-title {
        font-size: 20px;

        .anticon {
          font-size: 22px;
        }
      }

      .page-desc {
        font-size: 13px;
      }
    }

    // Profile cards row - stack vertically
    .profile-cards-row {
      flex-direction: column;

      .profile-card-col {
        margin-bottom: 12px;
      }

      .right-cards-col {
        .right-cards-row {
          flex-direction: column;

          .ant-col {
            margin-bottom: 12px;
          }
        }
      }
    }

    // Profile card adjustments
    .profile-card {
      border-radius: 10px;

      .avatar-section {
        padding: 16px 0;

        ::v-deep .ant-avatar {
          width: 80px !important;
          height: 80px !important;
          line-height: 80px !important;
        }

        .username {
          font-size: 18px;
          margin: 12px 0 6px;
        }
      }

      .profile-info {
        .info-item {
          padding: 10px 0;
          flex-wrap: wrap;

          .anticon {
            font-size: 14px;
            margin-right: 8px;
          }

          .label {
            font-size: 13px;
          }

          .value {
            font-size: 13px;
            word-break: break-all;
          }
        }
      }
    }

    // Credits card adjustments
    .credits-card {
      border-radius: 10px;

      .credits-header {
        .credits-title {
          font-size: 15px;

          .anticon {
            font-size: 16px;
          }
        }
      }

      .credits-body {
        padding: 16px 0;

        .credits-amount {
          .amount-value {
            font-size: 32px;
          }

          .amount-label {
            font-size: 14px;
          }
        }

        .vip-status {
          font-size: 12px;
          margin-top: 10px;
        }
      }

      .credits-actions {
        .ant-btn {
          height: 34px;
          padding: 0 20px;
          font-size: 14px;
        }
      }

      .credits-hint {
        font-size: 11px;
        margin-top: 10px;
      }
    }

    // Referral card adjustments
    .referral-card {
      border-radius: 10px;

      .referral-header {
        .referral-title {
          font-size: 15px;

          .anticon {
            font-size: 16px;
          }
        }
      }

      .referral-body {
        padding: 10px 0;

        .referral-stats {
          .stat-item {
            .stat-value {
              font-size: 24px;
            }

            .stat-label {
              font-size: 11px;
            }
          }
        }

        .referral-link-section {
          .link-label {
            font-size: 11px;
          }

          .link-box {
            ::v-deep .ant-input {
              font-size: 12px;
            }
          }
        }

        .referral-hint {
          font-size: 11px;
          padding-top: 8px;
        }
      }
    }

    // Edit card adjustments
    .edit-card {
      border-radius: 10px;
      margin-top: 12px !important;

      ::v-deep .ant-card-body {
        padding: 12px;
      }

      ::v-deep .ant-tabs-nav {
        .ant-tabs-tab {
          padding: 10px 12px;
          font-size: 13px;
        }
      }

      // Allow horizontal scroll for tabs on mobile
      ::v-deep .ant-tabs-nav-scroll {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;

        &::-webkit-scrollbar {
          display: none;
        }
      }

      .profile-form {
        max-width: 100%;

        ::v-deep .ant-form-item-label {
          padding-bottom: 4px;

          label {
            font-size: 13px;
          }
        }

        ::v-deep .ant-input,
        ::v-deep .ant-input-password {
          font-size: 14px;
        }

        .email-hint {
          font-size: 11px;
        }
      }

      // Notification settings form
      .notification-settings-form {
        ::v-deep .ant-alert {
          font-size: 12px;
          padding: 8px 12px;
          margin-bottom: 16px !important;
        }

        ::v-deep .ant-form {
          max-width: 100%;
        }

        ::v-deep .ant-checkbox-group {
          .ant-row {
            margin-left: 0 !important;
            margin-right: 0 !important;

            .ant-col {
              padding-left: 0 !important;
              padding-right: 8px !important;
            }
          }

          .ant-checkbox-wrapper {
            font-size: 13px;
            margin-bottom: 6px;
          }
        }

        .field-hint {
          font-size: 11px;
          flex-wrap: wrap;
        }

        ::v-deep .ant-form-item {
          margin-bottom: 16px;
        }

        // Action buttons
        ::v-deep .ant-form-item:last-child {
          .ant-btn {
            width: 100%;
            margin-bottom: 8px;

            & + .ant-btn {
              margin-left: 0 !important;
            }
          }
        }
      }

      // Tables in tabs
      ::v-deep .ant-table-wrapper {
        overflow-x: auto;

        .ant-table {
          min-width: 500px;
        }
      }
    }

    // Referral user cell in table
    .referral-user-cell {
      gap: 8px;

      ::v-deep .ant-avatar {
        width: 28px !important;
        height: 28px !important;
        line-height: 28px !important;
      }

      .user-info {
        .nickname {
          font-size: 13px;
        }

        .username {
          font-size: 11px;
        }
      }
    }
  }
}

// Extra small devices (phones in portrait)
@media screen and (max-width: 480px) {
  .profile-page {
    padding: 8px;

    .page-header {
      margin-bottom: 12px;

      .page-title {
        font-size: 18px;
        gap: 8px;

        .anticon {
          font-size: 20px;
        }
      }
    }

    // Credits card
    .credits-card {
      .credits-body {
        .credits-amount {
          .amount-value {
            font-size: 28px;
          }

          .amount-label {
            font-size: 13px;
          }
        }
      }

      .credits-actions {
        .ant-btn {
          width: 100%;
        }
      }
    }

    // Referral card
    .referral-card {
      .referral-body {
        .referral-stats {
          .stat-item {
            .stat-value {
              font-size: 20px;
            }
          }
        }
      }
    }

    // Edit card
    .edit-card {
      ::v-deep .ant-tabs-nav {
        .ant-tabs-tab {
          padding: 8px 10px;
          font-size: 12px;
        }
      }

      // Notification settings - stack checkboxes
      .notification-settings-form {
        ::v-deep .ant-checkbox-group {
          .ant-row {
            .ant-col {
              flex: 0 0 50%;
              max-width: 50%;
            }
          }
        }
      }
    }
  }
}
</style>

<style lang="less">
.referral-balance-strip {
  display: grid;
  grid-template-columns: minmax(145px, 1fr) minmax(112px, auto) auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
  margin-top: 1px;
  padding-top: 9px;
  border-top: 1px solid var(--qd-border);

  .referral-balance-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    white-space: nowrap;

    > span {
      color: var(--qd-text-muted);
      font-size: 11px;
    }

    strong {
      color: var(--qd-text);
      font-size: 13px;
      line-height: 1.3;
    }
  }

  .referral-balance-primary strong {
    font-size: 16px;

    small {
      color: var(--qd-text-muted);
      font-size: 10px;
      font-weight: 600;
    }
  }

  .reward-withdraw-btn {
    height: 30px;
    border-radius: 6px;
    white-space: nowrap;
  }
}

@media screen and (max-width: 640px) {
  .referral-balance-strip {
    grid-template-columns: minmax(0, 1fr) auto;

    .referral-balance-item:nth-child(2) {
      display: none;
    }
  }
}

.referral-record-tabs {
  ::v-deep .ant-tabs-bar { margin-bottom: 16px; }
  ::v-deep .ant-tabs-tab { padding-top: 0; }
}

.reward-withdrawal-form { margin-top: 18px; }
</style>

<template>
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<view class="hh-tabs">
					<view
						v-for="tab in tabs"
						:key="tab.value"
						class="hh-tab"
						:class="{ on: status === tab.value }"
						@click="changeStatus(tab.value)"
					>
						{{ tab.label }}
						<text v-if="tab.value === 'reviewing' && reviewingTotal" class="hh-badge">{{ reviewingTotal }}</text>
					</view>
				</view>
				<button class="uni-button" type="primary" size="mini" :loading="loading" @click="load()">刷新</button>
			</view>
		</view>

		<view class="uni-container">
			<view class="hh-toolbar">
				<view class="hh-filter">
					<text class="hh-filter-label">情绪</text>
					<picker :range="moodOptions" range-key="label" @change="changeMood">
						<view class="hh-picker">{{ moodText }}</view>
					</picker>
				</view>
				<view class="hh-summary">共 {{ total }} 条{{ status === 'reviewing' ? '待审核' : '记录' }}</view>
			</view>

			<uni-table :loading="loading" border stripe emptyText="没有数据">
				<uni-tr>
					<uni-th align="center" width="90">情绪</uni-th>
					<uni-th>内容</uni-th>
					<uni-th align="center" width="90">状态</uni-th>
					<uni-th align="center" width="70">举报</uni-th>
					<uni-th align="center" width="70">抱抱</uni-th>
					<uni-th align="center" width="150">时间</uni-th>
					<uni-th align="center" width="210">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="item in list" :key="item.id">
					<uni-td align="center">
						<text class="hh-mood">{{ moodLabel(item.mood) }}</text>
					</uni-td>
					<uni-td>
						<view class="hh-text">{{ item.text }}</view>
					</uni-td>
					<uni-td align="center">
						<uni-tag :type="statusTagType(item.status)" :text="statusLabel(item.status)" size="small" />
					</uni-td>
					<uni-td align="center">
						<text :class="{ 'hh-danger': item.reportCount > 0 }">{{ item.reportCount }}</text>
					</uni-td>
					<uni-td align="center">{{ item.hugCount }}</uni-td>
					<uni-td align="center">{{ formatTime(item.at) }}</uni-td>
					<uni-td align="center">
						<view class="uni-group">
							<button class="uni-button" size="mini" type="primary" @click="openDetail(item)">查看</button>
							<button
								v-if="item.status !== 'published'"
								class="uni-button"
								size="mini"
								type="default"
								@click="moderate(item, 'publish')"
							>放行</button>
							<button
								v-if="item.status !== 'hidden'"
								class="uni-button"
								size="mini"
								type="warn"
								@click="moderate(item, 'hide')"
							>下架</button>
						</view>
					</uni-td>
				</uni-tr>
			</uni-table>

			<view class="uni-pagination-box">
				<uni-pagination
					show-icon
					:page-size="size"
					v-model="page"
					:total="total"
					@change="onPageChange"
				/>
			</view>
		</view>

		<!-- 详情 -->
		<view v-if="detailVisible" class="hh-mask" @click="closeDetail">
			<view class="hh-dialog" @click.stop>
				<view class="hh-dialog-head">
					<text class="hh-dialog-title">帖子详情</text>
					<text class="hh-dialog-close" @click="closeDetail">×</text>
				</view>

				<scroll-view scroll-y class="hh-dialog-body">
					<view v-if="detailLoading" class="hh-loading">正在加载…</view>
					<template v-else-if="detail">
						<view class="hh-detail-meta">
							<uni-tag :type="statusTagType(detail.post.status)" :text="statusLabel(detail.post.status)" size="small" />
							<text class="hh-detail-mood">{{ moodLabel(detail.post.mood) }}</text>
							<text class="hh-detail-time">{{ formatTime(detail.post.at) }}</text>
						</view>

						<view class="hh-detail-text">{{ detail.post.text }}</view>

						<view class="hh-detail-stats">
							<view class="hh-detail-stat">
								<text class="hh-detail-stat-value">{{ detail.post.hugCount }}</text>
								<text class="hh-detail-stat-label">抱抱</text>
							</view>
							<view class="hh-detail-stat">
								<text class="hh-detail-stat-value">{{ detail.post.echoCount }}</text>
								<text class="hh-detail-stat-label">回应</text>
							</view>
							<view class="hh-detail-stat">
								<text class="hh-detail-stat-value" :class="{ 'hh-danger': detail.post.reportCount > 0 }">{{ detail.post.reportCount }}</text>
								<text class="hh-detail-stat-label">举报</text>
							</view>
							<view class="hh-detail-stat">
								<text class="hh-detail-stat-value">{{ detail.post.risk ? '是' : '否' }}</text>
								<text class="hh-detail-stat-label">危机词</text>
							</view>
						</view>

						<view class="hh-detail-author">作者标识：{{ detail.post.author || '匿名' }}</view>

						<view class="hh-detail-section">
							<view class="hh-detail-section-title">回应（{{ detail.echoes.length }}）</view>
							<view v-if="!detail.echoes.length" class="hh-empty">还没有回应</view>
							<view v-for="(echo, index) in detail.echoes" :key="'e' + index" class="hh-echo">
								<text class="hh-echo-text">{{ echo.text }}</text>
								<text class="hh-echo-time">{{ formatTime(echo.at) }}</text>
							</view>
						</view>

						<view class="hh-detail-section">
							<view class="hh-detail-section-title">举报记录（{{ detail.reports.length }}）</view>
							<view v-if="!detail.reports.length" class="hh-empty">没有举报</view>
							<view v-for="(report, index) in detail.reports" :key="'r' + index" class="hh-report">
								<text>{{ report.reason }}</text>
								<text class="hh-report-time">{{ formatTime(report.at) }}</text>
							</view>
						</view>
					</template>
					<view v-else class="hh-loading">加载失败，请重试</view>
				</scroll-view>

				<view class="hh-dialog-actions">
					<button
						v-if="detail && detail.post.status !== 'published'"
						class="uni-button hh-action-btn"
						type="primary"
						@click="moderate(detail.post, 'publish')"
					>放行</button>
					<button
						v-if="detail && detail.post.status !== 'hidden'"
						class="uni-button hh-action-btn"
						type="warn"
						@click="moderate(detail.post, 'hide')"
					>下架</button>
					<button
						v-if="detail && detail.post.status === 'published'"
						class="uni-button hh-action-btn"
						type="default"
						@click="moderate(detail.post, 'review')"
					>转审核</button>
					<button class="uni-button hh-action-btn" type="default" @click="closeDetail">关闭</button>
				</view>
			</view>
		</view>

		<!-- #ifndef H5 -->
		<fix-window />
		<!-- #endif -->
	</view>
</template>

<script>
	import {
		huanhuan,
		moodLabel,
		statusLabel,
		statusTagType,
		formatTime
	} from '@/common/huanhuan-api.js'

	const MOOD_OPTIONS = [
		{ value: '', label: '全部' },
		{ value: 'anxious', label: '焦虑' },
		{ value: 'low', label: '低落' },
		{ value: 'sleep', label: '失眠' },
		{ value: 'friction', label: '摩擦' },
		{ value: 'social', label: '社交' },
		{ value: 'tired', label: '疲惫' }
	]

	export default {
		data() {
			return {
				tabs: [
					{ value: 'reviewing', label: '待审核' },
					{ value: 'published', label: '已发布' },
					{ value: 'hidden', label: '已下架' },
					{ value: 'all', label: '全部' }
				],
				status: 'reviewing',
				mood: '',
				moodOptions: MOOD_OPTIONS,
				list: [],
				page: 1,
				size: 20,
				total: 0,
				reviewingTotal: 0,
				loading: false,
				pendingPostId: '',
				detailVisible: false,
				detailLoading: false,
				detail: null
			}
		},
		computed: {
			moodText() {
				const item = MOOD_OPTIONS.find(m => m.value === this.mood)
				return item ? item.label : '全部'
			}
		},
		onLoad(options) {
			if (!uni.getStorageSync('uni_id_token')) {
				uni.reLaunch({
					url: '/uni_modules/uni-id-pages/pages/login/login-withpwd?uniIdRedirectUrl=' +
						encodeURIComponent('/pages/huanhuan/posts/posts')
				})
				return
			}
			this.pendingPostId = (options && options.postId) || ''
			this.load()
			this.loadReviewingCount()
		},
		methods: {
			moodLabel,
			statusLabel,
			statusTagType,
			formatTime,
			async load() {
				if (this.loading) return
				this.loading = true
				try {
					const res = await huanhuan.adminListQueue({
						status: this.status,
						mood: this.mood,
						skip: (this.page - 1) * this.size,
						limit: this.size
					})
					this.list = res.list || []
					this.total = res.total || 0
					if (this.pendingPostId) {
						const target = this.pendingPostId
						this.pendingPostId = ''
						this.openDetailById(target)
					}
				} catch (error) {
					this.handleError(error)
				} finally {
					this.loading = false
				}
			},
			async loadReviewingCount() {
				try {
					const res = await huanhuan.adminListQueue({ status: 'reviewing', limit: 1 })
					this.reviewingTotal = res.total || 0
				} catch (e) {
					this.reviewingTotal = 0
				}
			},
			changeStatus(value) {
				if (this.status === value) return
				this.status = value
				this.page = 1
				this.load()
			},
			changeMood(event) {
				const index = Number(event.detail.value) || 0
				this.mood = MOOD_OPTIONS[index].value
				this.page = 1
				this.load()
			},
			onPageChange(event) {
				this.page = (event && event.current) || 1
				this.load()
			},
			openDetail(item) {
				this.openDetailById(item.id)
			},
			async openDetailById(id) {
				this.detailVisible = true
				this.detailLoading = true
				this.detail = null
				try {
					const res = await huanhuan.adminGetPost({ postId: id })
					this.detail = res
				} catch (error) {
					this.handleError(error)
				} finally {
					this.detailLoading = false
				}
			},
			closeDetail() {
				this.detailVisible = false
				this.detail = null
			},
			moderate(post, action) {
				const labels = { publish: '放行', hide: '下架', review: '转审核' }
				const text = labels[action] || action
				uni.showModal({
					title: text + '这条？',
					content: action === 'hide'
						? '下架后所有人（包括作者）都看不到这条内容。'
						: action === 'publish'
							? '放行后所有用户都能看到，举报计数会清零。'
							: '转审核后只有作者自己能看到。',
					confirmText: text,
					confirmColor: action === 'hide' ? '#BE8567' : '#55707F',
					success: async res => {
						if (!res.confirm) return
						try {
							await huanhuan.adminModerate({ postId: post.id, action })
							uni.showToast({ title: text + '成功', icon: 'none' })
							this.closeDetail()
							this.load()
							this.loadReviewingCount()
						} catch (error) {
							this.handleError(error)
						}
					}
				})
			},
			handleError(error) {
				if (error && error.needLogin) {
					uni.showModal({
						title: '需要登录',
						content: '登录状态已过期，请重新登录。',
						showCancel: false,
						success() {
							uni.reLaunch({ url: '/uni_modules/uni-id-pages/pages/login/login-withpwd' })
						}
					})
					return
				}
				if (error && error.forbidden) {
					uni.showModal({
						title: '没有权限',
						content: '当前账号没有 admin 角色。请在 uniCloud 控制台给账号添加 admin 角色后重新登录。',
						showCancel: false
					})
					return
				}
				uni.showToast({ title: (error && error.message) || '请求失败', icon: 'none' })
			}
		}
	}
</script>

<style scoped>
	.hh-tabs {
		display: flex;
		align-items: center;
		margin-right: 16px;
		background: #F1EAE1;
		border-radius: 999px;
		padding: 3px;
	}

	.hh-tab {
		position: relative;
		padding: 5px 14px;
		border-radius: 999px;
		font-size: 13px;
		color: #5F5A52;
		cursor: pointer;
		white-space: nowrap;
	}

	.hh-tab.on {
		background: #FFFDFB;
		color: #3E5B69;
		font-weight: 600;
		box-shadow: 0 1px 4px rgba(74, 64, 54, 0.08);
	}

	.hh-badge {
		display: inline-block;
		min-width: 16px;
		height: 16px;
		line-height: 16px;
		margin-left: 4px;
		padding: 0 4px;
		border-radius: 12px;
		background: #be8567;
		color: #fff;
		font-size: 11px;
		text-align: center;
	}

	.hh-toolbar {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
	}

	.hh-filter {
		display: flex;
		align-items: center;
	}

	.hh-filter-label {
		margin-right: 8px;
		font-size: 13px;
		color: #8A8177;
	}

	.hh-picker {
		padding: 4px 12px;
		border: 1px solid #E4DACD;
		border-radius: 10px;
		font-size: 13px;
		color: #2A2723;
		cursor: pointer;
		background: #FFFDFB;
	}

	.hh-summary {
		margin-left: auto;
		font-size: 13px;
		color: #8A8177;
	}

	.hh-text {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
		font-size: 13px;
		line-height: 1.6;
		color: #2A2723;
		white-space: pre-wrap;
	}

	.hh-mood {
		font-size: 13px;
		color: #5F5A52;
	}

	.hh-danger {
		color: #be8567;
		font-weight: 600;
	}

	.hh-mask {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(38, 33, 29, 0.42);
	}

	.hh-dialog {
		width: 640px;
		max-width: calc(100vw - 40px);
		max-height: 84vh;
		display: flex;
		flex-direction: column;
		background: #FFFDFB;
		border-radius: 14px;
		box-shadow: 0 24px 60px rgba(74, 64, 54, 0.16);
		overflow: hidden;
	}

	.hh-dialog-head {
		display: flex;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid #EDE5DA;
	}

	.hh-dialog-title {
		font-size: 16px;
		font-weight: 600;
		color: #2A2723;
	}

	.hh-dialog-close {
		margin-left: auto;
		font-size: 22px;
		line-height: 1;
		color: #8A8177;
		cursor: pointer;
	}

	.hh-dialog-body {
		flex: 1;
		max-height: 58vh;
		padding: 20px;
		box-sizing: border-box;
	}

	.hh-loading {
		padding: 40px 0;
		text-align: center;
		font-size: 13px;
		color: #8A8177;
	}

	.hh-detail-meta {
		display: flex;
		align-items: center;
	}

	.hh-detail-mood {
		margin-left: 10px;
		font-size: 13px;
		color: #5F5A52;
	}

	.hh-detail-time {
		margin-left: auto;
		font-size: 12px;
		color: #A79E93;
	}

	.hh-detail-text {
		margin-top: 16px;
		padding: 16px;
		border-radius: 12px;
		background: #F8F4EE;
		font-size: 14px;
		line-height: 1.85;
		color: #2A2723;
		white-space: pre-wrap;
	}

	.hh-detail-stats {
		display: flex;
		margin-top: 16px;
		border: 1px solid #EDE5DA;
		border-radius: 12px;
		overflow: hidden;
	}

	.hh-detail-stat {
		flex: 1;
		padding: 12px 0;
		text-align: center;
		border-right: 1px solid #EDE5DA;
	}

	.hh-detail-stat:last-child {
		border-right: none;
	}

	.hh-detail-stat-value {
		display: block;
		font-size: 18px;
		font-weight: 600;
		color: #2A2723;
	}

	.hh-detail-stat-label {
		display: block;
		margin-top: 2px;
		font-size: 12px;
		color: #8A8177;
	}

	.hh-detail-author {
		margin-top: 12px;
		font-size: 12px;
		color: #A79E93;
		word-break: break-all;
	}

	.hh-detail-section {
		margin-top: 22px;
	}

	.hh-detail-section-title {
		margin-bottom: 10px;
		font-size: 13px;
		font-weight: 600;
		color: #5F5A52;
	}

	.hh-empty {
		font-size: 13px;
		color: #A79E93;
	}

	.hh-echo {
		display: flex;
		align-items: flex-start;
		padding: 10px 12px;
		margin-bottom: 8px;
		border-radius: 10px;
		background: #FBF8F3;
	}

	.hh-echo-text {
		flex: 1;
		font-size: 13px;
		line-height: 1.6;
		color: #2A2723;
	}

	.hh-echo-time {
		margin-left: 12px;
		font-size: 12px;
		color: #A79E93;
		white-space: nowrap;
	}

	.hh-report {
		display: flex;
		align-items: center;
		padding: 8px 12px;
		margin-bottom: 6px;
		border-radius: 10px;
		background: #FBF2EC;
		font-size: 13px;
		color: #9C6A4E;
	}

	.hh-report-time {
		margin-left: auto;
		font-size: 12px;
		color: #A79E93;
	}

	.hh-dialog-actions {
		display: flex;
		justify-content: flex-end;
		padding: 12px 20px;
		border-top: 1px solid #EDE5DA;
	}

	.hh-action-btn {
		margin-left: 10px;
	}
</style>

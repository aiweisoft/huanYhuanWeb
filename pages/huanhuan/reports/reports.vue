<template>
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<input
					class="uni-search"
					type="text"
					v-model="postId"
					placeholder="按帖子 ID 过滤"
					@confirm="search"
				/>
				<button class="uni-button" type="primary" size="mini" @click="search">查询</button>
				<button class="uni-button" type="default" size="mini" @click="reset">重置</button>
				<button class="uni-button" type="default" size="mini" :loading="loading" @click="load()">刷新</button>
			</view>
		</view>

		<view class="uni-container">
			<view class="hh-toolbar">
				<view class="hh-summary">共 {{ total }} 条举报{{ postId ? '（已按帖子过滤）' : '' }}</view>
			</view>

			<uni-table :loading="loading" border stripe emptyText="没有举报记录">
				<uni-tr>
					<uni-th align="center" width="170">时间</uni-th>
					<uni-th align="center" width="180">原因</uni-th>
					<uni-th>帖子 ID</uni-th>
					<uni-th align="center" width="220">举报人</uni-th>
					<uni-th align="center" width="130">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="item in list" :key="item.id">
					<uni-td align="center">{{ formatTime(item.at) }}</uni-td>
					<uni-td align="center">
						<uni-tag type="warning" :text="item.reason" size="small" />
					</uni-td>
					<uni-td>
						<text class="hh-id">{{ item.postId }}</text>
					</uni-td>
					<uni-td align="center">
						<text class="hh-id">{{ item.reporter || '-' }}</text>
					</uni-td>
					<uni-td align="center">
						<button class="uni-button" size="mini" type="primary" @click="openPost(item.postId)">查看帖子</button>
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

		<!-- #ifndef H5 -->
		<fix-window />
		<!-- #endif -->
	</view>
</template>

<script>
	import { huanhuan, formatTime } from '@/common/huanhuan-api.js'

	export default {
		data() {
			return {
				postId: '',
				appliedPostId: '',
				list: [],
				page: 1,
				size: 50,
				total: 0,
				loading: false
			}
		},
		onLoad(options) {
			if (!uni.getStorageSync('uni_id_token')) {
				uni.reLaunch({
					url: '/uni_modules/uni-id-pages/pages/login/login-withpwd?uniIdRedirectUrl=' +
						encodeURIComponent('/pages/huanhuan/reports/reports')
				})
				return
			}
			this.postId = (options && options.postId) || ''
			this.appliedPostId = this.postId
			this.load()
		},
		methods: {
			formatTime,
			async load() {
				if (this.loading) return
				this.loading = true
				try {
					const res = await huanhuan.adminListReports({
						postId: this.appliedPostId || undefined,
						skip: (this.page - 1) * this.size,
						limit: this.size
					})
					this.list = res.list || []
					this.total = res.total || 0
				} catch (error) {
					this.handleError(error)
				} finally {
					this.loading = false
				}
			},
			search() {
				this.appliedPostId = this.postId.trim()
				this.page = 1
				this.load()
			},
			reset() {
				this.postId = ''
				this.appliedPostId = ''
				this.page = 1
				this.load()
			},
			onPageChange(event) {
				this.page = (event && event.current) || 1
				this.load()
			},
			openPost(postId) {
				if (!postId) return
				uni.navigateTo({
					url: '/pages/huanhuan/posts/posts?postId=' + encodeURIComponent(postId)
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
	.hh-toolbar {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
	}

	.hh-summary {
		font-size: 13px;
		color: #8A8177;
	}

	.hh-id {
		font-size: 12px;
		color: #5F5A52;
		word-break: break-all;
	}
</style>

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
					>{{ tab.label }}</view>
				</view>
				<button class="uni-button" type="primary" size="mini" @click="openEditor()">新增文章</button>
				<button class="uni-button" type="default" size="mini" :loading="seeding" @click="seed">导入内置文章</button>
				<button class="uni-button" type="default" size="mini" @click="openImport">批量导入</button>
				<button class="uni-button" type="default" size="mini" :loading="loading" @click="load()">刷新</button>
			</view>
		</view>

		<view class="uni-container">
			<view class="hh-toolbar">
				<view class="hh-summary">共 {{ total }} 篇{{ status === 'all' ? '文章' : '' }} · 按更新时间倒序</view>
			</view>

			<uni-table :loading="loading" border stripe emptyText="还没有文章，可以点「导入内置文章」">
				<uni-tr>
					<uni-th>标题</uni-th>
					<uni-th align="center" width="120">分类</uni-th>
					<uni-th align="center" width="90">来源</uni-th>
					<uni-th align="center" width="90">状态</uni-th>
					<uni-th align="center" width="80">App 排序</uni-th>
					<uni-th align="center" width="150">更新时间</uni-th>
					<uni-th align="center" width="230">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="item in list" :key="item.id">
					<uni-td>
						<view class="hh-title">{{ item.title }}</view>
						<view class="hh-sub">{{ item.summary }}</view>
					</uni-td>
					<uni-td align="center">{{ item.category }}</uni-td>
					<uni-td align="center">{{ item.source }}</uni-td>
					<uni-td align="center">
						<uni-tag :type="statusTagType(item.status)" :text="statusLabel(item.status)" size="small" />
					</uni-td>
					<uni-td align="center">{{ item.sort }}</uni-td>
					<uni-td align="center">{{ formatTime(item.updatedAt || item.at) }}</uni-td>
					<uni-td align="center">
						<view class="uni-group">
							<button class="uni-button" size="mini" type="primary" @click="openEditor(item)">编辑</button>
							<button
								v-if="item.status !== 'published'"
								class="uni-button"
								size="mini"
								type="default"
								@click="setStatus(item, 'published')"
							>发布</button>
							<button
								v-if="item.status !== 'draft'"
								class="uni-button"
								size="mini"
								type="default"
								@click="setStatus(item, 'draft')"
							>草稿</button>
							<button
								v-if="item.status === 'published'"
								class="uni-button"
								size="mini"
								type="warn"
								@click="setStatus(item, 'hidden')"
							>下架</button>
							<button class="uni-button" size="mini" type="warn" @click="remove(item)">删除</button>
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

		<!-- 编辑器 -->
		<view v-if="editorVisible" class="hh-mask" @click="closeEditor">
			<view class="hh-dialog" @click.stop>
				<view class="hh-dialog-head">
					<text class="hh-dialog-title">{{ form.id ? '编辑文章' : '新增文章' }}</text>
					<text class="hh-dialog-close" @click="closeEditor">×</text>
				</view>

				<scroll-view scroll-y class="hh-dialog-body">
					<view v-if="editorLoading" class="hh-loading">正在加载…</view>
					<template v-else>
						<view class="hh-field">
							<text class="hh-label">标题</text>
							<input v-model="form.title" class="hh-input" maxlength="100" placeholder="一句话说清这篇在讲什么" />
						</view>

						<view class="hh-row">
							<view class="hh-field hh-half">
								<text class="hh-label">分类</text>
								<input v-model="form.category" class="hh-input" maxlength="20" placeholder="如：认识情绪" />
							</view>
							<view class="hh-field hh-half">
								<text class="hh-label">来源</text>
								<input v-model="form.source" class="hh-input" maxlength="40" placeholder="编辑部" />
							</view>
						</view>

						<view class="hh-row">
							<view class="hh-field hh-third">
								<text class="hh-label">状态</text>
								<picker :range="statusOptions" range-key="label" @change="changeFormStatus">
									<view class="hh-picker hh-picker-block">{{ formStatusLabel }}</view>
								</picker>
							</view>
							<view class="hh-field hh-third">
								<text class="hh-label">排序（大的在前）</text>
								<input v-model="form.sort" class="hh-input" type="number" placeholder="0" />
							</view>
							<view class="hh-field hh-third">
								<text class="hh-label">阅读分钟</text>
								<input v-model="form.minutes" class="hh-input" type="number" placeholder="3" />
							</view>
						</view>

						<view class="hh-field">
							<text class="hh-label">摘要</text>
							<textarea v-model="form.summary" class="hh-textarea hh-textarea-sm" maxlength="200" placeholder="列表里显示的两行简介" />
						</view>

						<view class="hh-field">
							<text class="hh-label">正文（一行一段）</text>
							<textarea v-model="form.body" class="hh-textarea" :maxlength="-1" placeholder="第一段…&#10;第二段…" />
						</view>

						<view class="hh-field">
							<text class="hh-label">原文链接（可选）</text>
							<input v-model="form.url" class="hh-input" maxlength="500" placeholder="https://" />
						</view>
					</template>
				</scroll-view>

				<view class="hh-dialog-actions">
					<button class="uni-button hh-action-btn" type="default" @click="closeEditor">取消</button>
					<button class="uni-button hh-action-btn" type="primary" :loading="saving" @click="save">保存</button>
				</view>
			</view>
		</view>

		<!-- 批量导入 -->
		<view v-if="importVisible" class="hh-mask" @click="closeImport">
			<view class="hh-dialog hh-dialog-lg" @click.stop>
				<view class="hh-dialog-head">
					<text class="hh-dialog-title">批量导入文章</text>
					<text class="hh-dialog-close" @click="closeImport">×</text>
				</view>

				<scroll-view scroll-y class="hh-dialog-body">
					<view class="hh-import-tip">
						粘贴 JSON 数组，或 <text class="hh-code">tools/rss-import.mjs</text> 生成的
						<text class="hh-code">articles.generated.js</text> 全文（带 <text class="hh-code">export default</text> 也可以）。
						同 id 的文章会自动跳过；没有 id 的条目无法去重，重复导入会产生重复文章。
						JSON 里的 <text class="hh-code">status</text> 不决定发布状态：不勾选「直接发布」一律存草稿。
					</view>

					<view class="hh-field">
						<textarea
							v-model="importText"
							class="hh-textarea hh-import-textarea"
							:maxlength="-1"
							placeholder='[{"id":"rss-xxx","title":"标题","category":"外部导入","summary":"摘要","body":["第一段","第二段"],"url":"https://..."}]'
							@input="importError = ''"
						/>
					</view>

					<view class="hh-import-row">
						<view class="hh-check" @click="importPublishing = !importPublishing">
							<view class="hh-check-box" :class="{ on: importPublishing }">
								<text v-if="importPublishing" class="hh-check-mark">✓</text>
							</view>
							<text>导入后直接发布（不勾选则存为草稿）</text>
						</view>
						<text class="hh-import-count">{{ importCountText }}</text>
					</view>

					<view v-if="importError" class="hh-import-error">{{ importError }}</view>
				</scroll-view>

				<view class="hh-dialog-actions">
					<button class="uni-button hh-action-btn" type="default" @click="closeImport">取消</button>
					<button class="uni-button hh-action-btn" type="primary" :loading="importing" @click="doImport">导入</button>
				</view>
			</view>
		</view>

		<!-- #ifndef H5 -->
		<fix-window />
		<!-- #endif -->
	</view>
</template>

<script>
	import { huanhuan, formatTime } from '@/common/huanhuan-api.js'
	import SEED_ARTICLES from '@/common/huanhuan-seed-articles.js'

	const STATUS_OPTIONS = [
		{ value: 'published', label: '已发布' },
		{ value: 'draft', label: '草稿' },
		{ value: 'hidden', label: '已下架' }
	]

	function emptyForm() {
		return {
			id: '',
			title: '',
			category: '',
			source: '编辑部',
			summary: '',
			body: '',
			url: '',
			minutes: 3,
			sort: 0,
			status: 'draft'
		}
	}

	export default {
		data() {
			return {
				tabs: [
					{ value: 'published', label: '已发布' },
					{ value: 'draft', label: '草稿' },
					{ value: 'hidden', label: '已下架' },
					{ value: 'all', label: '全部' }
				],
				statusOptions: STATUS_OPTIONS,
				status: 'published',
				allList: [],
				list: [],
				page: 1,
				size: 20,
				total: 0,
				loading: false,
				seeding: false,
				editorVisible: false,
				editorLoading: false,
				saving: false,
				form: emptyForm(),
				importVisible: false,
				importText: '',
				importPublishing: false,
				importing: false,
				importError: ''
			}
		},
		computed: {
			formStatusLabel() {
				const item = STATUS_OPTIONS.find(s => s.value === this.form.status)
				return item ? item.label : '草稿'
			},
			importCountText() {
				if (!this.importText.trim()) return ''
				const size = this.importText.length
				try {
					return '识别到 ' + this.parseImport(this.importText).length + ' 条 · ' + size + ' 字符'
				} catch (e) {
					return size + ' 字符 · 格式待检查'
				}
			}
		},
		onLoad() {
			if (!uni.getStorageSync('uni_id_token')) {
				uni.reLaunch({
					url: '/uni_modules/uni-id-pages/pages/login/login-withpwd?uniIdRedirectUrl=' +
						encodeURIComponent('/pages/huanhuan/articles/articles')
				})
				return
			}
			this.load()
		},
		methods: {
			formatTime,
			statusLabel(value) {
				const item = STATUS_OPTIONS.find(s => s.value === value)
				return item ? item.label : value
			},
			statusTagType(value) {
				if (value === 'published') return 'success'
				if (value === 'draft') return 'warning'
				return 'default'
			},
			async load() {
				if (this.loading) return
				this.loading = true
				try {
					// 云对象单次最多 100 条：先按状态把所有页拉完，再统一按更新时间倒序，
					// 避免只对当前页排序、或云函数还没重新部署时顺序不对
					const all = []
					let skip = 0
					for (let page = 0; page < 10; page++) {
						const res = await huanhuan.adminListArticles({
							status: this.status,
							skip,
							limit: 100
						})
						const rows = (res && res.list) || []
						all.push(...rows)
						if (!res || !res.hasMore || !rows.length) break
						skip += rows.length
					}

					all.sort((a, b) => {
						const left = (a && (a.updatedAt || a.at)) || 0
						const right = (b && (b.updatedAt || b.at)) || 0
						return right - left
					})

					this.allList = all
					this.renderPage()
				} catch (error) {
					this.handleError(error)
				} finally {
					this.loading = false
				}
			},
			renderPage() {
				this.total = this.allList.length
				const maxPage = Math.max(1, Math.ceil(this.total / this.size))
				if (this.page > maxPage) this.page = maxPage
				const start = (this.page - 1) * this.size
				this.list = this.allList.slice(start, start + this.size)
			},
			changeStatus(value) {
				if (this.status === value) return
				this.status = value
				this.page = 1
				this.load()
			},
			onPageChange(event) {
				this.page = (event && event.current) || 1
				this.renderPage()
			},
			openEditor(item) {
				this.editorVisible = true
				this.form = emptyForm()
				if (!item) return
				this.editorLoading = true
				huanhuan.adminGetArticle({ id: item.id }).then(res => {
					const article = res.article || {}
					this.form = {
						id: article.id || '',
						title: article.title || '',
						category: article.category || '',
						source: article.source || '编辑部',
						summary: article.summary || '',
						body: (article.body || []).join('\n'),
						url: article.url || '',
						minutes: article.minutes || 3,
						sort: article.sort || 0,
						status: article.status || 'draft'
					}
				}).catch(error => {
					this.handleError(error)
					this.closeEditor()
				}).finally(() => {
					this.editorLoading = false
				})
			},
			closeEditor() {
				this.editorVisible = false
				this.form = emptyForm()
			},
			changeFormStatus(event) {
				const index = Number(event.detail.value) || 0
				this.form.status = STATUS_OPTIONS[index].value
			},
			async save() {
				if (this.saving) return
				if (!String(this.form.title || '').trim()) {
					uni.showToast({ title: '标题不能为空', icon: 'none' })
					return
				}
				const body = String(this.form.body || '')
					.split('\n')
					.map(item => item.trim())
					.filter(Boolean)
				if (!body.length) {
					uni.showToast({ title: '正文至少写一段', icon: 'none' })
					return
				}

				this.saving = true
				try {
					await huanhuan.adminSaveArticle({
						id: this.form.id || undefined,
						title: this.form.title,
						category: this.form.category,
						source: this.form.source,
						summary: this.form.summary,
						body,
						url: this.form.url,
						minutes: Number(this.form.minutes) || 3,
						sort: Number(this.form.sort) || 0,
						status: this.form.status
					})
					uni.showToast({ title: '已保存', icon: 'none' })
					this.closeEditor()
					this.load()
				} catch (error) {
					this.handleError(error)
				} finally {
					this.saving = false
				}
			},
			setStatus(item, status) {
				huanhuan.adminSetArticleStatus({ id: item.id, status }).then(() => {
					const label = status === 'published' ? '已发布' : (status === 'draft' ? '已转为草稿' : '已下架')
					uni.showToast({ title: label, icon: 'none' })
					this.load()
				}).catch(error => this.handleError(error))
			},
			remove(item) {
				uni.showModal({
					title: '删除这篇？',
					content: '删除后不可恢复。如果只是暂时不想展示，建议用「下架」。',
					confirmText: '删除',
					confirmColor: '#BE8567',
					success: res => {
						if (!res.confirm) return
						huanhuan.adminDeleteArticle({ id: item.id }).then(() => {
							uni.showToast({ title: '已删除', icon: 'none' })
							this.load()
						}).catch(error => this.handleError(error))
					}
				})
			},
			openImport() {
				this.importVisible = true
				this.importText = ''
				this.importError = ''
				this.importPublishing = false
			},
			closeImport() {
				if (this.importing) return
				this.importVisible = false
				this.importText = ''
				this.importError = ''
			},
			parseImport(text) {
				let raw = String(text || '').trim()
				if (!raw) throw new Error('请先粘贴 JSON 内容')
				raw = raw
					.replace(/^\uFEFF/, '')
					.replace(/^\s*\/\/.*$/gm, '')
					.replace(/^\s*export\s+default\s+/, '')
					.replace(/^\s*module\.exports\s*=\s*/, '')
					.replace(/;\s*$/, '')
					.trim()

				let data
				try {
					data = JSON.parse(raw)
				} catch (e) {
					throw new Error('JSON 解析失败：' + e.message)
				}

				const list = Array.isArray(data)
					? data
					: (data && Array.isArray(data.articles) ? data.articles : null)
				if (!list) throw new Error('内容需要是数组，或 { articles: [...] }')
				return list
			},
			normalizeImported(list) {
				return list.map((item, index) => {
					const title = String((item && item.title) || '').trim()
					if (!title) throw new Error('第 ' + (index + 1) + ' 条缺少标题')

					let body = item && item.body
					if (typeof body === 'string') body = body.split('\n')
					body = (Array.isArray(body) ? body : [])
						.map(part => String(part || '').trim())
						.filter(Boolean)
					if (!body.length) throw new Error('第 ' + (index + 1) + ' 条正文为空')

					// 勾选「导入后直接发布」= 全部发布；不勾选 = 一律草稿
					// （JSON 里的 status 不再覆盖勾选框，只有 hidden 会原样保留）
					const status = this.importPublishing
						? 'published'
						: (item && item.status === 'hidden' ? 'hidden' : 'draft')

					return {
						id: item && item.id ? String(item.id).slice(0, 64) : undefined,
						title,
						category: String((item && item.category) || '').trim().slice(0, 20) || '外部导入',
						source: String((item && item.source) || '').trim().slice(0, 40) || '外部导入',
						summary: String((item && item.summary) || '').trim().slice(0, 200),
						body,
						url: String((item && item.url) || '').trim().slice(0, 500),
						minutes: Math.min(Math.max(Number(item && item.minutes) || 3, 1), 120),
						status,
						sort: Math.min(Math.max(Number(item && item.sort) || 0, 0), 99999),
						at: Number(item && item.at) || undefined
					}
				})
			},
			async doImport() {
				if (this.importing) return
				this.importError = ''

				let list
				try {
					list = this.parseImport(this.importText)
				} catch (e) {
					this.importError = e.message
					return
				}
				if (!list.length) {
					this.importError = '没有可导入的文章'
					return
				}
				if (list.length > 500) {
					this.importError = '一次最多 500 篇，请分批导入'
					return
				}

				let articles
				try {
					articles = this.normalizeImported(list)
				} catch (e) {
					this.importError = e.message
					return
				}

				this.importing = true
				let inserted = 0
				let skipped = 0
				let cursor = 0

				try {
					const CHUNK = 10
					for (let i = 0; i < articles.length; i += CHUNK) {
						cursor = i
						const res = await huanhuan.adminSeedArticles({
							articles: articles.slice(i, i + CHUNK)
						})
						inserted += res.inserted || 0
						skipped += res.skipped || 0
					}

					uni.showToast({
						title: '新增 ' + inserted + ' 篇（' + (this.importPublishing ? '已发布' : '已存草稿') + '），跳过 ' + skipped + ' 篇',
						icon: 'none'
					})
					this.importVisible = false
					this.importText = ''
					this.status = this.importPublishing ? 'published' : 'draft'
					this.page = 1
					this.load()
				} catch (error) {
					if (error && (error.needLogin || error.forbidden)) {
						this.handleError(error)
						return
					}
					const done = inserted + skipped
					this.importError = '导到第 ' + (cursor + 1) + ' 条时中断：' + ((error && error.message) || '请重试') +
						(done ? '（已处理 ' + done + ' 篇，可刷新查看）' : '')
					uni.showToast({ title: '导入中断', icon: 'none' })
				} finally {
					this.importing = false
				}
			},
			seed() {
				uni.showModal({
					title: '导入内置文章',
					content: '会把 App 里的 12 篇文章写入云端，已存在的同 id 文章会自动跳过。',
					confirmText: '导入',
					success: res => {
						if (!res.confirm) return
						this.seeding = true
						huanhuan.adminSeedArticles({ articles: SEED_ARTICLES }).then(result => {
							uni.showToast({
								title: '新增 ' + (result.inserted || 0) + ' 篇，跳过 ' + (result.skipped || 0) + ' 篇',
								icon: 'none'
							})
							this.load()
						}).catch(error => this.handleError(error)).finally(() => {
							this.seeding = false
						})
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

	.hh-toolbar {
		margin-bottom: 12px;
	}

	.hh-summary {
		font-size: 13px;
		color: #8A8177;
	}

	.hh-title {
		font-size: 13px;
		font-weight: 600;
		color: #2A2723;
		line-height: 1.5;
	}

	.hh-sub {
		margin-top: 2px;
		font-size: 12px;
		color: #8A8177;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
		overflow: hidden;
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
		width: 720px;
		max-width: calc(100vw - 40px);
		max-height: 88vh;
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
		max-height: 66vh;
		padding: 20px;
		box-sizing: border-box;
	}

	.hh-loading {
		padding: 40px 0;
		text-align: center;
		font-size: 13px;
		color: #8A8177;
	}

	.hh-field {
		margin-bottom: 16px;
	}

	.hh-row {
		display: flex;
		margin-right: -12px;
	}

	.hh-half {
		flex: 1;
		margin-right: 12px;
	}

	.hh-third {
		flex: 1;
		margin-right: 12px;
	}

	.hh-label {
		display: block;
		margin-bottom: 6px;
		font-size: 13px;
		color: #5F5A52;
	}

	.hh-input {
		width: 100%;
		height: 36px;
		padding: 0 10px;
		box-sizing: border-box;
		border: 1px solid #E4DACD;
		border-radius: 10px;
		font-size: 13px;
		color: #2A2723;
		background: #FFFDFB;
	}

	.hh-picker {
		padding: 8px 12px;
		border: 1px solid #E4DACD;
		border-radius: 10px;
		font-size: 13px;
		color: #2A2723;
		cursor: pointer;
		background: #FFFDFB;
	}

	.hh-picker-block {
		height: 36px;
		line-height: 20px;
		box-sizing: border-box;
	}

	.hh-textarea {
		width: 100%;
		height: 220px;
		padding: 10px;
		box-sizing: border-box;
		border: 1px solid #E4DACD;
		border-radius: 10px;
		font-size: 13px;
		line-height: 1.7;
		color: #2A2723;
		background: #FFFDFB;
	}

	.hh-textarea-sm {
		height: 72px;
	}

	.hh-import-tip {
		margin-bottom: 14px;
		font-size: 13px;
		line-height: 1.8;
		color: #5F5A52;
	}

	.hh-code {
		padding: 1px 6px;
		border-radius: 10px;
		background: #F4EFE7;
		font-family: Consolas, Menlo, monospace;
		font-size: 12px;
		color: #3E5B69;
	}

	.hh-dialog-lg {
		width: 780px;
	}

	.hh-import-textarea {
		height: 300px;
		font-family: Consolas, Menlo, monospace;
		font-size: 12px;
		line-height: 1.6;
	}

	.hh-import-row {
		display: flex;
		align-items: center;
		margin-top: 4px;
	}

	.hh-check {
		display: flex;
		align-items: center;
		font-size: 13px;
		color: #5F5A52;
		cursor: pointer;
	}

	.hh-check-box {
		width: 16px;
		height: 16px;
		margin-right: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #E4DACD;
		border-radius: 6px;
		background: #FFFDFB;
	}

	.hh-check-box.on {
		background: #3E5B69;
		border-color: #3E5B69;
	}

	.hh-check-mark {
		color: #fff;
		font-size: 11px;
		line-height: 1;
	}

	.hh-import-count {
		margin-left: auto;
		font-size: 12px;
		color: #8A8177;
	}

	.hh-import-error {
		margin-top: 12px;
		padding: 10px 12px;
		border-radius: 10px;
		background: #FBEEEC;
		color: #A8544A;
		font-size: 12px;
		line-height: 1.6;
		word-break: break-all;
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

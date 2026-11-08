// 「缓一缓」后台 API 封装
// 所有读写都走云对象 huanhuan-co，管理方法在服务端校验 admin 角色

const co = uniCloud.importObject('huanhuan-co', {
	customUI: true
})

const LOGIN_CODES = [
	'HUAN_LOGIN_REQUIRED',
	'uni-id-token-expired',
	'uni-id-check-token-failed',
	'uni-id-permission-error'
]

function wrapError(error) {
	const raw = error || {}
	const code = raw.errCode || (raw.error && raw.error.errCode) || raw.code || 'UNKNOWN'
	const message = raw.errMsg || (raw.error && raw.error.errMsg) || raw.message || '请求失败，请稍后再试'

	if (LOGIN_CODES.indexOf(code) > -1) {
		return { code, message: '登录已过期，请重新登录', needLogin: true, raw }
	}
	if (code === 'HUAN_FORBIDDEN') {
		return { code, message: message || '没有管理权限', forbidden: true, raw }
	}
	return { code, message, raw }
}

async function call(method, params) {
	try {
		return await co[method](params || {})
	} catch (error) {
		throw wrapError(error)
	}
}

export const huanhuan = {
	// 管理端
	adminListQueue(params) {
		return call('adminListQueue', params)
	},
	adminGetPost(params) {
		return call('adminGetPost', params)
	},
	adminModerate(params) {
		return call('adminModerate', params)
	},
	adminListReports(params) {
		return call('adminListReports', params)
	},
	// 文章
	adminListArticles(params) {
		return call('adminListArticles', params)
	},
	adminGetArticle(params) {
		return call('adminGetArticle', params)
	},
	adminSaveArticle(params) {
		return call('adminSaveArticle', params)
	},
	adminDeleteArticle(params) {
		return call('adminDeleteArticle', params)
	},
	adminSetArticleStatus(params) {
		return call('adminSetArticleStatus', params)
	},
	adminSeedArticles(params) {
		return call('adminSeedArticles', params)
	},
	// 只读（后台预览用）
	listPosts(params) {
		return call('listPosts', params)
	},
	getPost(params) {
		return call('getPost', params)
	}
}

export const MOOD_LABELS = {
	anxious: '焦虑',
	low: '低落',
	sleep: '失眠',
	friction: '摩擦',
	social: '社交',
	tired: '疲惫'
}

export const STATUS_LABELS = {
	published: '已发布',
	reviewing: '待审核',
	hidden: '已下架'
}

export const STATUS_TAG_TYPES = {
	published: 'success',
	reviewing: 'warning',
	hidden: 'default'
}

export function moodLabel(id) {
	return MOOD_LABELS[id] || id || '-'
}

export function statusLabel(id) {
	return STATUS_LABELS[id] || id || '-'
}

export function statusTagType(id) {
	return STATUS_TAG_TYPES[id] || 'grey'
}

export function formatTime(ts) {
	const value = Number(ts)
	if (!value || !Number.isFinite(value)) return '-'
	const d = new Date(value)
	if (Number.isNaN(d.getTime())) return '-'
	const pad = n => (n < 10 ? '0' + n : '' + n)
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
		' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

module.exports = { //会议室预定1
	PROJECT_COLOR: '#2870E5',
	NAV_COLOR: '#ffffff',
	NAV_BG: '#2870E5',


	// setup
	SETUP_CONTENT_ITEMS: [
		{ title: '关于我们', key: 'SETUP_CONTENT_ABOUT' },
	],

	// 用户
	USER_REG_CHECK: false,
	USER_FIELDS: [
		{ mark: 'department', title: '所在部门', type: 'text', must: false },
	],

	NEWS_NAME: '公告通知',
	NEWS_CATE: [
		{ id: 1, title: '公告通知', style: 'leftbig1' },

	],
	NEWS_FIELDS: [
	],

	ENROLL_NAME: '会议室',
	ENROLL_CATE: [
		{ id: 1, title: '会议室预定' },
	],
	ENROLL_FIELDS: [
		{ mark: 'cover', title: '封面图片', type: 'image', min: 1, max: 1, must: true },
		{ mark: 'person', title: '最大容纳人数', type: 'text', must: true },
		{ mark: 'tools', title: '设施情况', type: 'checkbox', selectOptions: ['白板', '投影仪', '话筒', '音箱'], checkBoxLimit: 1, must: false },
	],
	ENROLL_JOIN_FIELDS: [
		{ mark: 'name', type: 'text', title: '会议名称', must: true, max: 30, edit: false },
		{ mark: 'desc', type: 'textarea', title: '会议描述', must: false, max: 100, edit: false },
		{ mark: 'person', type: 'text', title: '预订人', must: true, max: 30, edit: false },
		{ mark: 'tel', type: 'mobile', title: '联系电话', must: true, edit: false },
	],

}
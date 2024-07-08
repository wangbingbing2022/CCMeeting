const cloudHelper = require('../../../../../helper/cloud_helper.js');
const pageHelper = require('../../../../../helper/page_helper.js');
const timeHelper = require('../../../../../helper/time_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false,

		isLoadTime: false,

		day: timeHelper.time('Y-M-D'),
		used: []
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		ProjectBiz.initPage(this);

		if (!pageHelper.getOptions(this, options)) return;

		//	if (!await PassportBiz.loginMustBackWin(this)) return;

		if (options && options.day) {
			this.setData({ day: options.day });
		}

		await this._loadDetail();

		this._loadDayData(this.data.day);
	},

	_loadDetail: async function () {
		let id = this.data.id;
		if (!id) return;

		let params = {
			id,
		};
		let opt = {
			title: 'bar'
		};
		let enroll = await cloudHelper.callCloudData('enroll/view', params, opt);
		if (!enroll) {
			this.setData({
				isLoad: null
			})
			return;
		}

		this.setData({
			enroll,
			isLoad: true
		});


	},

	_loadDayData: async function (day) {
		if (!day) return;

		this.setData({
			isLoadTime: false,
		});

		let params = {
			enrollId: this.data.id,
			day,
		};
		let opt = {
			title: 'bar'
		};
		await cloudHelper.callCloudSumbit('enroll/day', params, opt).then(res => {
			this.setData({
				isLoadTime: true,
				used: res.data
			});
		});

	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () { },

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: async function () {
		this._loadDayData(this.data.day);
	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () { },

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () { },

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: async function () {
		await this._loadDetail();
		await this._loadDayData(this.data.day);
		wx.stopPullDownRefresh();
	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () { },

	bindDateSelectCmpt: function (e) {
		this.setData({
			day: e.detail
		}, () => {
			this._loadDayData(e.detail);
		});
	},

	bindTimeSelectCmpt: async function (e) {
		if (!await PassportBiz.loginMustCancelWin(this)) return;

		let start = encodeURIComponent(e.detail.start);
		let end = encodeURIComponent(e.detail.end);
		let endPoint = encodeURIComponent(e.detail.endPoint);
		let day = encodeURIComponent(this.data.day);

		let url = `../join/enroll_join?id=${this.data.enroll._id}&start=${start}&end=${end}&endPoint=${endPoint}&day=${day}`;

		wx.navigateTo({
			url,
		});
	},


	url: function (e) {
		pageHelper.url(e, this);
	},


	onPageScroll: function (e) {
		// 回页首按钮
		pageHelper.showTopBtn(e, this);

	},

	onShareAppMessage: function (res) {
		return {
			title: '预定' + this.data.enroll.ENROLL_TITLE,
			imageUrl: this.data.enroll.ENROLL_OBJ.cover[0]
		}
	}
})
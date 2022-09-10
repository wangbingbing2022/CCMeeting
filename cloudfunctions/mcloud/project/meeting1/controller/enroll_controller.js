/**
 * Notes: 登记模块控制器
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 2022-06-23 04:00:00 
 */

const BaseProjectController = require('./base_project_controller.js');
const EnrollService = require('../service/enroll_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');

class EnrollController extends BaseProjectController {

	_getTimeShow(start, end) {
		let startDay = timeUtil.timestamp2Time(start, 'M月D日');
		let startTime = timeUtil.timestamp2Time(start, 'h:m');
		let week = timeUtil.week(timeUtil.timestamp2Time(start, 'Y-M-D'));
		week = '';

		if (end) {
			let endDay = timeUtil.timestamp2Time(end, 'M月D日');
			let endTime = timeUtil.timestamp2Time(end, 'h:m');

			if (startDay != endDay)
				return `${startDay} ${startTime} ${week}～${endDay} ${endTime}`;
			else
				return `${startDay} ${startTime}～${endTime} ${week}`;
		}
		else
			return `${startDay} ${startTime} ${week}`;
	}

	/** 列表 */
	async getEnrollList() {

		// 数据校验
		let rules = {
			search: 'string|min:1|max:30|name=搜索条件',
			sortType: 'string|name=搜索类型',
			sortVal: 'name=搜索类型值',
			orderBy: 'object|name=排序',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		let result = await service.getEnrollList(input);

		// 数据格式化
		let list = result.list;

		for (let k = 0; k < list.length; k++) {
			if (list[k].ENROLL_OBJ && list[k].ENROLL_OBJ.desc)
				delete list[k].ENROLL_OBJ.desc;
		}

		return result;

	}


	/** 浏览详细 */
	async viewEnroll() {
		// 数据校验
		let rules = {
			id: 'must|id',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		let enroll = await service.viewEnroll(this._userId, input.id);

		if (enroll) {
			enroll.statusDesc = service.getJoinStatusDesc(enroll);
		}

		return enroll;
	}

	/** 获取从某天开始可报名的日期 */
	async getEnrollJoinHasDaysFromDay() {

		// 数据校验
		let rules = {
			day: 'must|date|name=日期',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		let list = await service.getEnrollJoinHasDaysFromDay(input.day);
		return list;

	}

	/** 按天获取所有预约 */
	async getEnrollJoinAllListByDay() {

		// 数据校验
		let rules = {
			day: 'must|date|name=日期',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		let list = await service.getEnrollJoinAllListByDay(input.day);
		return list;


	}

	async getEnrollJoinByDay() {
		// 数据校验
		let rules = {
			enrollId: 'must|id',
			day: 'must|string',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		let list = await service.getEnrollJoinByDay(input.enrollId, input.day);

		let ret = [];
		for (let k = 0; k < list.length; k++) {
			let node = {
				start: list[k].ENROLL_JOIN_START,
				end: list[k].ENROLL_JOIN_END,
				title: list[k].ENROLL_JOIN_OBJ.person + ' / ' + list[k].ENROLL_JOIN_OBJ.name,
				url: '../my_join_detail/enroll_my_join_detail?id=' + list[k]._id
			}
			ret.push(node);
		}

		return ret;
	}

	/** 我的预约登记列表 */
	async getMyEnrollJoinList() {

		// 数据校验
		let rules = {
			search: 'string|min:1|max:30|name=搜索条件',
			sortType: 'string|name=搜索类型',
			sortVal: 'name=搜索类型值',
			orderBy: 'object|name=排序',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		let result = await service.getMyEnrollJoinList(this._userId, input);

		// 数据格式化
		let list = result.list;


		for (let k = 0; k < list.length; k++) {

			let year = list[k].ENROLL_JOIN_DAY.split('-');
			list[k].ENROLL_JOIN_DAY_DESC = year[0] + '年' + year[1] + '月' + year[2] + '日';

			list[k].ENROLL_JOIN_ADD_TIME = timeUtil.timestamp2Time(list[k].ENROLL_JOIN_ADD_TIME, 'Y-M-D h:m');
			list[k].ENROLL_JOIN_LAST_TIME = timeUtil.timestamp2Time(list[k].ENROLL_JOIN_LAST_TIME, 'Y-M-D h:m');
		}

		result.list = list;

		return result;

	}

	/** 我的登记详情 */
	async getMyEnrollJoinDetail() {
		// 数据校验
		let rules = {
			enrollJoinId: 'must|id',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		let enrollJoin = await service.getMyEnrollJoinDetail(input.enrollJoinId);
		if (enrollJoin) {
			let year = enrollJoin.ENROLL_JOIN_DAY.split('-');
			enrollJoin.ENROLL_JOIN_DAY_DESC = year[0] + '年' + year[1] + '月' + year[2] + '日';

			enrollJoin.ENROLL_JOIN_ADD_TIME = timeUtil.timestamp2Time(enrollJoin.ENROLL_JOIN_ADD_TIME);
			enrollJoin.ENROLL_JOIN_LAST_TIME = timeUtil.timestamp2Time(enrollJoin.ENROLL_JOIN_LAST_TIME);
		}
		return enrollJoin;

	}

	/**  登记前获取关键信息 */
	async detailForEnrollJoin() {
		// 数据校验
		let rules = {
			enrollId: 'must|id',
			enrollJoinId: 'id',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		let meet = await service.detailForEnrollJoin(this._userId, input.enrollId, input.enrollJoinId);

		if (meet) {
			// 显示转换  
		}

		return meet;
	}

	/** 登记提交 */
	async enrollJoin() {
		// 数据校验
		let rules = {
			enrollId: 'must|id',
			start: 'must|string',
			end: 'must|string',
			endPoint: 'must|string',
			day: 'must|string',
			forms: 'must|array',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		return await service.enrollJoin(this._userId, input.enrollId, input.start, input.end, input.endPoint, input.day, input.forms);
	}

	/** 登记修改提交 */
	async enrollJoinEdit() {
		// 数据校验
		let rules = {
			enrollId: 'must|id',
			enrollJoinId: 'must|id',
			forms: 'must|array',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		return await service.enrollJoinEdit(this._userId, input.enrollId, input.enrollJoinId, input.forms);
	}

	/** 登记取消*/
	async cancelMyEnrollJoin() {
		// 数据校验
		let rules = {
			enrollJoinId: 'must|id',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new EnrollService();
		return await service.cancelMyEnrollJoin(this._userId, input.enrollJoinId);
	}
}

module.exports = EnrollController;
/**
 * Notes: 登记表格模块业务逻辑
 * Ver : CCMiniCloud Framework 3.2.11 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 2022-07-04 07:48:00 
 */

const BaseProjectService = require('./base_project_service.js');
const util = require('../../../framework/utils/util.js');
const dataUtil = require('../../../framework/utils/data_util.js');
const ENROLL_NAME = '会议室';
const UserModel = require('../model/user_model.js');
const EnrollModel = require('../model/enroll_model.js');
const EnrollJoinModel = require('../model/enroll_join_model.js');

class EnrollService extends BaseProjectService {

	// 获取当前登记状态
	getJoinStatusDesc(enroll) {

		return '进行中';
	}

	/** 浏览信息 */
	async viewEnroll(userId, id) {

		let fields = '*';

		let where = {
			_id: id,
			ENROLL_STATUS: EnrollModel.STATUS.COMM
		}
		let enroll = await EnrollModel.getOne(where, fields);
		if (!enroll) return null;

		EnrollModel.inc(id, 'ENROLL_VIEW_CNT', 1);

		// 判断是否有登记
		let whereJoin = {
			ENROLL_JOIN_USER_ID: userId,
			ENROLL_JOIN_ENROLL_ID: id,
			ENROLL_JOIN_STATUS: ['in', [EnrollJoinModel.STATUS.WAIT, EnrollJoinModel.STATUS.SUCC]]
		}
		let enrollJoin = await EnrollJoinModel.getOne(whereJoin);
		if (enrollJoin) {
			enroll.myEnrollJoinId = enrollJoin._id;
			enroll.myEnrollJoinTag = (enrollJoin.ENROLL_JOIN_STATUS == EnrollJoinModel.STATUS.WAIT) ? '待审核' : '已预约';
		}
		else {
			enroll.myEnrollJoinId = '';
			enroll.myEnrollJoinTag = '';
		}

		return enroll;
	}


	/** 取得分页列表 */
	async getEnrollList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序 
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'ENROLL_ORDER': 'asc',
			'ENROLL_ADD_TIME': 'desc'
		};
		let fields = 'ENROLL_STOP,ENROLL_JOIN_CNT,ENROLL_OBJ,ENROLL_VIEW_CNT,ENROLL_TITLE,ENROLL_ORDER,ENROLL_STATUS,ENROLL_CATE_NAME';

		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

		where.and.ENROLL_STATUS = EnrollModel.STATUS.COMM; // 状态  

		if (util.isDefined(search) && search) {
			where.or = [{
				ENROLL_TITLE: ['like', search]
			},];
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'cateId': {
					if (sortVal) where.and.ENROLL_CATE_ID = String(sortVal);
					break;
				}
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'ENROLL_ADD_TIME');
					break;
				}

			}
		}

		return await EnrollModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	// 获取某天某会议室预约情况
	async getEnrollJoinByDay(enrollId, day) {
		let where = {
			ENROLL_JOIN_DAY: day,
			ENROLL_JOIN_ENROLL_ID: enrollId,
		};
		return EnrollJoinModel.getAll(where);
	}


	/** 取得我的登记分页列表 */
	async getMyEnrollJoinList(userId, {
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序 
		page,
		size,
		isTotal = true,
		oldTotal
	}) {
		orderBy = orderBy || {
			'ENROLL_JOIN_ADD_TIME': 'desc'
		};
		let fields = 'ENROLL_JOIN_OBJ,ENROLL_JOIN_DAY,ENROLL_JOIN_START,ENROLL_JOIN_END,ENROLL_JOIN_END_POINT,ENROLL_JOIN_LAST_TIME,ENROLL_JOIN_REASON,ENROLL_JOIN_ENROLL_ID,ENROLL_JOIN_STATUS,ENROLL_JOIN_ADD_TIME,enroll.ENROLL_TITLE,enroll.ENROLL_EDIT_SET,enroll.ENROLL_CANCEL_SET';

		let where = {
			ENROLL_JOIN_USER_ID: userId
		};

		if (util.isDefined(search) && search) {
			where['enroll.ENROLL_TITLE'] = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType) {
			// 搜索菜单
			switch (sortType) {
				case 'timedesc': { //按时间倒序
					orderBy = {
						'ENROLL_JOIN_ADD_TIME': 'desc'
					};
					break;
				}
				case 'timeasc': { //按时间正序
					orderBy = {
						'ENROLL_JOIN_ADD_TIME': 'asc'
					};
					break;
				}
				case 'succ': {
					where.ENROLL_JOIN_STATUS = EnrollJoinModel.STATUS.SUCC;
					break;
				}
				case 'wait': {
					where.ENROLL_JOIN_STATUS = EnrollJoinModel.STATUS.WAIT;
					break;
				}
				case 'cancel': {
					where.ENROLL_JOIN_STATUS = EnrollJoinModel.STATUS.ADMIN_CANCEL;
					break;
				}
			}
		}

		let joinParams = {
			from: EnrollModel.CL,
			localField: 'ENROLL_JOIN_ENROLL_ID',
			foreignField: '_id',
			as: 'enroll',
		};

		let result = await EnrollJoinModel.getListJoin(joinParams, where, fields, orderBy, page, size, isTotal, oldTotal);

		return result;
	}

	/**
	 * 获取从某天开始有预约的日期
	 * @param {*} fromDay  日期 Y-M-D
	 */
	async getEnrollJoinHasDaysFromDay(fromDay) {
		let where = {
			ENROLL_JOIN_DAY: ['>=', fromDay],
		};

		let fields = 'ENROLL_JOIN_DAY';
		let list = await EnrollJoinModel.distinct(where, fields);
 
		return list;
	}

	/** 按天获取所有预定项目 */
	async getEnrollJoinAllListByDay(day) {
		let where = {
			ENROLL_JOIN_STATUS: EnrollJoinModel.STATUS.SUCC,
			ENROLL_JOIN_DAY: day,
		};

		let orderBy = {
			'ENROLL_JOIN_START': 'asc',
			'ENROLL_JOIN_ADD_TIME': 'desc'
		};

		let fields = 'ENROLL_JOIN_START,ENROLL_JOIN_END_POINT,ENROLL_JOIN_OBJ';

		let list = await EnrollJoinModel.getAll(where, fields, orderBy);

		let retList = [];

		for (let k = 0; k < list.length; k++) {
			console.log(list[k])
			let node = {};
			node.timeDesc = list[k].ENROLL_JOIN_START;
			node.title = list[k].ENROLL_JOIN_OBJ.name; 
			node._id = list[k]._id;
			retList.push(node);

		}
		return retList;
	}

	/** 取得我的登记详情 */
	async getMyEnrollJoinDetail(enrollJoinId) {

		let fields = '*';

		let where = {
			_id: enrollJoinId
		};
		let enrollJoin = await EnrollJoinModel.getOne(where, fields);
		if (enrollJoin) {
			enrollJoin.enroll = await EnrollModel.getOne(enrollJoin.ENROLL_JOIN_ENROLL_ID, 'ENROLL_TITLE');
		}

		return enrollJoin;
	}

	//################## 登记 
	// 登记 
	async enrollJoin(userId, enrollId, start, end, endPoint, day, forms) {

		// 登记是否结束
		let whereEnroll = {
			_id: enrollId,
			ENROLL_STATUS: EnrollModel.STATUS.COMM
		}
		let enroll = await EnrollModel.getOne(whereEnroll);
		if (!enroll)
			this.AppError('该' + ENROLL_NAME + '不存在或者已经停止');



		// 时段是否冲突 TODO


		// 入库
		let data = {
			ENROLL_JOIN_USER_ID: userId,
			ENROLL_JOIN_ENROLL_ID: enrollId,

			ENROLL_JOIN_START: start,
			ENROLL_JOIN_END: end,
			ENROLL_JOIN_END_POINT: endPoint,
			ENROLL_JOIN_DAY: day,

			ENROLL_JOIN_STATUS: (enroll.ENROLL_CHECK_SET == 0) ? EnrollJoinModel.STATUS.SUCC : EnrollJoinModel.STATUS.WAIT,

			ENROLL_JOIN_FORMS: forms,
			ENROLL_JOIN_OBJ: dataUtil.dbForms2Obj(forms),
		}

		let enrollJoinId = await EnrollJoinModel.insert(data);

		// 统计数量
		this.statEnrollJoin(enrollId);

		let check = enroll.ENROLL_CHECK_SET;

		return { enrollJoinId, check }

	}


	// 修改登记 
	async enrollJoinEdit(userId, enrollId, enrollJoinId, forms) {
		let whereJoin = {
			_id: enrollJoinId,
			ENROLL_JOIN_USER_ID: userId,
			ENROLL_JOIN_ENROLL_ID: enrollId,
			ENROLL_JOIN_STATUS: ['in', [EnrollJoinModel.STATUS.WAIT, EnrollJoinModel.STATUS.SUCC]],
		}
		let enrollJoin = await EnrollJoinModel.getOne(whereJoin);
		if (!enrollJoin)
			this.AppError('该' + ENROLL_NAME + '记录不存在或者已经被系统取消');

		// 登记是否结束
		let whereEnroll = {
			_id: enrollId,
			ENROLL_STATUS: EnrollModel.STATUS.COMM
		}
		let enroll = await EnrollModel.getOne(whereEnroll);
		if (!enroll)
			this.AppError('该' + ENROLL_NAME + '不存在或者已经停止');


		if (enroll.ENROLL_EDIT_SET == 0)
			this.AppError('该' + ENROLL_NAME + '不允许修改资料');


		if (enroll.ENROLL_EDIT_SET == 3
			&& enroll.ENROLL_CHECK_SET == 1
			&& enrollJoin.ENROLL_JOIN_STATUS == EnrollJoinModel.STATUS.SUCC
		)
			this.AppError('该' + ENROLL_NAME + '已通过审核，不能修改资料');


		let data = {
			ENROLL_JOIN_FORMS: forms,
			ENROLL_JOIN_OBJ: dataUtil.dbForms2Obj(forms),
			ENROLL_JOIN_LAST_TIME: this._timestamp,
		}
		await EnrollJoinModel.edit(whereJoin, data);

	}

	async statEnrollJoin(id) {
		let where = {
			ENROLL_JOIN_ENROLL_ID: id,
			ENROLL_JOIN_STATUS: ['in', [EnrollJoinModel.STATUS.WAIT, EnrollJoinModel.STATUS.SUCC]]
		}
		let cnt = await EnrollJoinModel.count(where);

		await EnrollModel.edit(id, { ENROLL_JOIN_CNT: cnt });
	}

	/**  登记前获取关键信息 */
	async detailForEnrollJoin(userId, enrollId, enrollJoinId = '') {
		let fields = 'ENROLL_JOIN_FORMS, ENROLL_TITLE';

		let where = {
			_id: enrollId,
			ENROLL_STATUS: EnrollModel.STATUS.COMM
		}
		let enroll = await EnrollModel.getOne(where, fields);
		if (!enroll)
			this.AppError('该' + ENROLL_NAME + '不存在');



		let joinMy = null;
		if (enrollJoinId) {
			// 编辑
			let whereMy = {
				ENROLL_JOIN_USER_ID: userId,
				_id: enrollJoinId
			}
			joinMy = await EnrollJoinModel.getOne(whereMy);
			enroll.join = {
				start: joinMy.ENROLL_JOIN_START,
				end: joinMy.ENROLL_JOIN_END,
				endPoint: joinMy.ENROLL_JOIN_END_POINT,
				day: joinMy.ENROLL_JOIN_DAY,
			}
		}
		else {
			// 取出本人最近一次的填写表单 
			/*
			let whereMy = {
				ENROLL_JOIN_USER_ID: userId,
			}
			let orderByMy = {
				ENROLL_JOIN_ADD_TIME: 'desc'
			}
			joinMy = await EnrollJoinModel.getOne(whereMy, 'ENROLL_JOIN_FORMS', orderByMy);*/
		}

		let myForms = joinMy ? joinMy.ENROLL_JOIN_FORMS : [];
		enroll.myForms = myForms;

		return enroll;
	}

	/** 取消我的登记 只有成功和待审核可以取消 取消即为删除记录 */
	async cancelMyEnrollJoin(userId, enrollJoinId) {
		let where = {
			ENROLL_JOIN_USER_ID: userId,
			_id: enrollJoinId,
			ENROLL_JOIN_STATUS: ['in', [EnrollJoinModel.STATUS.WAIT, EnrollJoinModel.STATUS.SUCC]]
		};
		let enrollJoin = await EnrollJoinModel.getOne(where);

		if (!enrollJoin) {
			this.AppError('未找到可取消的记录');
		}

		let enroll = await EnrollModel.getOne(enrollJoin.ENROLL_JOIN_ENROLL_ID);
		if (!enroll)
			this.AppError('该' + ENROLL_NAME + '不存在');

		if (enroll.ENROLL_CANCEL_SET == 0)
			this.AppError('该' + ENROLL_NAME + '不能取消');


		if (enroll.ENROLL_CANCEL_SET == 3
			&& enroll.ENROLL_CHECK_SET == 1
			&& enrollJoin.ENROLL_JOIN_STATUS == EnrollJoinModel.STATUS.SUCC
		)
			this.AppError('该' + ENROLL_NAME + '已通过审核，不能取消');

		await EnrollJoinModel.del(where);

		this.statEnrollJoin(enrollJoin.ENROLL_JOIN_ENROLL_ID);

	}

}

module.exports = EnrollService;
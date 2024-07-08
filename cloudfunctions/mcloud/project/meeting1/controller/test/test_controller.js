/**
 * Notes: 测试模块控制器
 * Date: 2021-03-15 19:20:00 
 */

const BaseController = require('../../controller/base_project_controller.js');
const fakerLib = require('../../../../framework/lib/faker_lib.js');

const EnrollModel = require('../../model/enroll_model.js');
const EnrollJoinModel = require('../../model/enroll_join_model.js');

class TestController extends BaseController {

	async test() {
		console.log('TEST>>>>>>>');
		global.PID = 'ZS1';

		this.mockEnrollJoin();

	}

	async mockEnrollJoin() {
		console.log('mockEnrollJoin >>>>>>> Begin....');
		let MAX_CNT = fakerLib.getIntBetween(10, 30);
		let ENROLL_ID = '0ab5303b62dd01c00feca25942c8d354';

		let enroll = await EnrollModel.getOne(ENROLL_ID);
		if (!enroll) return console.error('no enroll');

		let join = {};
		join.ENROLL_JOIN_ENROLL_ID = ENROLL_ID;
		join.ENROLL_JOIN_STATUS = 1;

		console.log('>>>>delete');
		let delCnt = await EnrollJoinModel.del({ ENROLL_JOIN_ENROLL_ID: ENROLL_ID });
		console.log('>>>>delete=' + delCnt);

		for (let k = 1; k <= MAX_CNT; k++) {
			console.log('>>>>insert >' + k);
			join.ENROLL_JOIN_USER_ID = fakerLib.getUuid();

			join.ENROLL_JOIN_LAST_TIME = fakerLib.getAddTimestamp();
			join.ENROLL_JOIN_ADD_TIME = fakerLib.getAddTimestamp();

			join.ENROLL_JOIN_FORMS = [
				{ mark: 'name', title: '姓名', type: 'text', val: fakerLib.getName() },
				{ mark: 'phone', title: '手机', type: 'mobile', val: fakerLib.getMobile() }
			];

			await EnrollJoinModel.insert(join);
		}

		console.log('>>>> STAT');
		let cnt = await EnrollJoinModel.count({
			ENROLL_JOIN_ENROLL_ID: ENROLL_ID
		});

		await EnrollModel.edit(ENROLL_ID, { ENROLL_JOIN_CNT: cnt });

		console.log('mockEnrollJoin >>>>>>> END');
	}

}

module.exports = TestController;
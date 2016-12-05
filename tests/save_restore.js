"use strict";


const expect = require('chai').expect;
const RobustTimers = require('./../index');


describe('states saving and restoring', () => {
	let r;
	before(() => {
		r = new RobustTimers();
	});

	describe('assign data source', () => {
		it('should call appropriate methods', () => {
			return new Promise((resolve, reject) => {
				let saved = false;
				let restored = false;
				let save = () => {
					saved = true;
					return Promise.resolve(true);
				};
				let restore = () => {
					restored = true;
					return Promise.resolve(true);
				};
				r.assignDataSource({
					save,
					restore
				});
				r.save();
				r.restore();
				setTimeout(() => {
					expect(saved).to.equal(true, 'should be saved');
					expect(restored).to.equal(true, 'should be restored');
					resolve();
				}, 200);
			})
		})
	});

	describe('with json-like dataSource', () => {
		let store = null;
		before(() => {
			store = null;
			r.assignDataSource({
				save: (me) => {
					let helpArr = {};
					for (let name in me.__timers) {
						let t = me.__timers[name];
						helpArr[t.name] = t.lastExecutionTimestamp;
					}
					store = JSON.stringify(helpArr);
					return Promise.resolve(true);
				},
				restore: (me) => {
					let helpArr = JSON.parse(store);
					for (let name in helpArr) {
						if (me.__timers[name]) {
							me.__timers[name].lastExecutionTimestamp = helpArr[name];
						}
					}
					return Promise.resolve(true);
				}
			});
		})
		it('show saved timer', () => {
			return new Promise((resolve, reject) => {
				r.interval('testing', 50, () => Promise.resolve(true));
				r.start();
				setTimeout(() => {
					r.save().then(() => {
						let temp = JSON.parse(store);
						expect(temp.testing).to.be.above(0);
						resolve();
					});
				}, 200);
			})
		});
		it('restore timer like it was called long time ago (timer should run immediatly)', () => {
			return new Promise((resolve, reject) => {
				let i = 0;
				r.interval('testing', 70, () => {
					i++;
					return Promise.resolve(true);
				});
				store = '{"testing":' + (Date.now() - 100) + '}';
				r.restore().then(() => {
					r.start();
					setTimeout(() => {
						expect(i).to.be.equal(14);
						resolve();
					}, 500);
				});
			})
		});
		it('restore timer like it was called few moments ago (timer should run after like it`s just created)', () => {
			return new Promise((resolve, reject) => {
				let i = 0;
				r.interval('testing', 70, () => {
					i++;
					return Promise.resolve(true);
				});
				store = '{"testing":' + (Date.now() - 1) + '}';
				r.restore().then(() => {
					r.start();
					setTimeout(() => {
						expect(i).to.be.equal(13);
						resolve();
					}, 500);
				});
			})
		});
	});
});
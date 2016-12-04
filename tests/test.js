"use strict";

const expect = require('chai').expect;
const RobustTimers = require('./../index');

expect(RobustTimers).to.be.a('function');

describe('RobustTimers', () => {
	describe('construction', () => {
		it('should be constructed without any params', () => {
			new RobustTimers();
		});
		describe('with options', () => {
			describe('#options.start', () => {
				it('should start if options.start == true', () => {
					let r = new RobustTimers({
						start: true
					});
					expect(r.__isStarted).to.equal(true);
				});
			});
			describe('#options.dataSource', () => {
				it('should provide options.dataSource methods to inner handlers', () => {
					let save = () => {};
					let restore = () => {};
					let r = new RobustTimers({
						dataSource: {
							save,
							restore
						}
					});
					expect(r.__onSaveHandler).to.equal(save);
					expect(r.__onRestoreHandler).to.equal(restore);
				});
			});
			describe('#options.restoreAndStart', () => {
				it('should start after restoring with options.restoreAndStart == true', () => {
					let save = () => {};
					let restored = false;
					let restore = () => {
						restored = true;
						return Promise.resolve(true);
					};
					let r = new RobustTimers({
						restoreAndStart: true,
						dataSource: {
							save,
							restore
						}
					});
					return new Promise((resolve, reject) => {
						setTimeout(() => {
							expect(restored).to.equals(true, 'Was not restored');
							expect(r.__isStarted).to.equals(true, 'Was not started');
							resolve();
						}, 10);
					});
				});
			});
		});
		describe('with start delay', () => {
			it('should run timer after 200ms start delay', () => {
				return new Promise((resolve, reject) => {
					let r = new RobustTimers();
					let results = [];
					let i = 0;
					r.interval('testing', 30, () => {
						results.push(i++);
						return Promise.resolve(true);
					});
					setTimeout(() => {
						r.start();
					}, 200);
					setTimeout(() => {
						expect(results).to.deep.equal([0, 1, 2]);
						resolve();
					}, 300);
				});
			});
		});
	});
	describe('timers', () => {
		let r;
		before(() => {
			r = new RobustTimers();
			r.start();
		});

		describe('creation', () => {
			it('should create timer which runs every 50 ms', () => {
				return new Promise((resolve, reject) => {
					let results = [];
					let i = 0;
					r.interval('testing', 50, () => {
						results.push(i++);
						return Promise.resolve(true);
					});
					setTimeout(() => {
						expect(results).to.deep.equal([0, 1, 2]);
						resolve();
					}, 170);
				});
			});
			it('should create timer(30ms) wich paused at 100ms', () => {
				return new Promise((resolve, reject) => {
					let results = [];
					let i = 0;
					r.interval('testing', 30, () => {
						results.push(i++);
						return Promise.resolve(true);
					});
					setTimeout(() => {
						r.deactivate('testing');
					}, 100);
					setTimeout(() => {
						expect(results).to.deep.equal([0, 1, 2]);
						resolve();
					}, 300);
				});
			});
			it('should create timer(30ms) which paused at 100ms and restored at 200ms', () => {
				return new Promise((resolve, reject) => {
					let results = [];
					let i = 0;
					r.interval('testing', 30, () => {
						results.push(i++);
						return Promise.resolve(true);
					});
					setTimeout(() => {
						r.deactivate('testing');
					}, 100);
					setTimeout(() => {
						r.activate('testing');
					}, 200);
					setTimeout(() => {
						expect(results).to.deep.equal([0, 1, 2, 3, 4, 5]);
						resolve();
					}, 300);
				});
			});
			it('should create timer(30ms) which runs only once', () => {
				return new Promise((resolve, reject) => {
					let results = [];
					let i = 0;
					r.once('testing', 30, () => {
						results.push(i++);
						return Promise.resolve(true);
					});
					setTimeout(() => {
						expect(results).to.deep.equal([0]);
						resolve();
					}, 100);
				});
			});
			/*
			it('should create timer(1ms) which runs more than 10000 times (memory leak test)', function(){
				this.timeout(30000);
				return new Promise((resolve, reject) => {
					let results = [];
					let i = 0;
					r.interval('testing', 1, () => {
						i++;
						return Promise.resolve(true);
					});
					setTimeout(() => {
						expect(i).to.be.above(10000);
						resolve();
					}, 20000);
				});
			});
			*/
		});
	});
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
});
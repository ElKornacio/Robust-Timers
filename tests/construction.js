"use strict";


const expect = require('chai').expect;
const RobustTimers = require('./../index');


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
				let save = () => {
				};
				let restore = () => {
				};
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
				let save = () => {
				};
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
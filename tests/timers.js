"use strict";


const expect = require('chai').expect;
const RobustTimers = require('./../index');


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
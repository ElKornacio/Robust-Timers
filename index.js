"use strict";

/**
 * @author Danila Simonov <ek@ek-mail.ru>
 */

/**
 *
 * Simple class used for multiple purposes regarding to timers.
 * Except obvious functions like registering, unregistering timers,
 * you can easily save and restore timers states, register "once" timers,
 * activate and deactivate registered timers, provide your own handlers
 * to serialize/unseriaize and save/restore timer states.
 *
 * All functions (except asynchronous) returns context to provide fluent
 * interface pattern.
 *
 * Meant that this class will be used as singleton, but it's up to you and yours
 * app's architecture.
 */
class RobustTimers {

	/**
	 * Just constructor.
	 * @constructor
	 * @param {Object} options - object containing options for construction.
	 * @param {boolean} options.start - if true - calls this.start() at the end of construction.
	 * @param {boolean} options.restoreAndStart - if true - calls this.restore() and after restoring states calls this.start(). Use only makes sense in combination with the provided options.dataSource param.
	 * @param {Object} options.dataSource - data source object. You can see object description at this.assignDataSource() method.
	 */
	constructor(options) {
		options = options || {};
		this.__timers = {};
		this.__isStarted = false;

		this.__onRestoreHandler = null;
		this.__onSaveHandler = null;

		if (options.dataSource) {
			this.assignDataSource(options.dataSource);
		}
		if (options.restoreAndStart) {
			this.restore().then((me) => {
				me.start();
			});
		} else
		if (options.start) {
			this.start();
		}
	}

	/**
	 * Executes given function in the next tick of event-loop. Works both in browsers and Node.js.
	 * @method
	 * @private
	 * @param {Function} func - executed function.
	 */
	__doInNextTick(func) {
		if (
			(typeof process !== 'undefined') &&
			(typeof process.nextTick == 'function')
			) {
			process.nextTick(func);
		} else {
			setTimeout(func, 0);
		}
	}

	/**
	 * Returns timer by it's name. If timer was not found - throws.
	 * @method
	 * @private
	 * @param {string} name - name of sought-for timer.
	 * @throws Will throw an error if the timer will not found.
	 */
	__checkExistenceAndGetByName(name) {
		let timer = this.__timers[name];
		if (!timer) {
			throw new Error('Timer was not found.');
		}
		return timer;
	}

	/**
	 * Returns timer by it's handler. If timer was not found - throws.
	 * @method
	 * @private
	 * @param {function} handler - handler of sought-for timer.
	 * @throws Will throw an error if the timer will not found.
	 */
	__checkExistenceAndGetByHandler(handler) {
		for (let name in this.__timers) {
			let timer = this.__timers[name];
			if (timer.handler == handler) {
				return name;
			}
		}
		return null;
	}

	/**
	 * Complex inner function, core of this class.
	 * It runs the timer basing on it inner state.
	 * If timer has been run in paste - next interval will be corrected due to it's last execution timestamp.
	 * If not - it will just setTimeout that will run timer's handler in specified interval, and catch it callback.
	 *
	 * It makes all process a little bit stateful and corrects intervals by timer's handler execution time.
	 * At the any time you can save all state, restart application, restore state, and everything will be as it was
	 * before restart, and intervals will be corrected by restart time cost (just because we are saving timestamps).
	 *
	 * It provides it's own callback to a timer's handler, and in this callback it decides what to do next -
	 * if it is "once"-timer - it just self-unregistering after execution, if it's usual interval-based timer -
	 * it reruns itself in the next event-loop tick (to avoid recusive problems) and everything starts again.
	 *
	 * @method
	 * @private
	 * @param {Object} timer - timer we are working with.
	 * @throws Will throw an exception if timer's handler will use callback function and return promise both.
	 */
	__continueTimerLifecycle(timer) {
		let startTime = Date.now();
		let hasEnded = false;
		let callback = () => {
			if (hasEnded) {
				throw new Error(
					'Handler can`t call callback and return Promise ' +
					'at the same time. Select one of variants.'
				);
			}
			timer.lastExecutionTimestamp = startTime;
			hasEnded = true;
			if (timer.isOnce) {
				this.unregister(timer.name);
			} else {
				if (this.__isStarted && timer.active) {
					this.__doInNextTick(
						this.__continueTimerLifecycle.bind(this, timer)
					);
				}
			}
		}
		let interval = timer.interval;
		if (timer.lastExecutionTimestamp) {
			let delta = startTime - timer.lastExecutionTimestamp - timer.interval;
			interval -= delta;
		}
		if (interval < 0) {
			interval = 0;
		}
		timer.currentTimeout = setTimeout(() => {
			timer.currentTimeout = null;
			let result = timer.handler.bind(timer.context)(callback);
			if (result instanceof Promise) {
				result.then(callback);
			}
		}, interval);
	}

	/**
	 * Registers new timer and runs it if needed.
	 *
	 * @method
	 * @param {Object} options - object containing options of timer.
	 * @param {string} options.name - name of the timer. Unique. Will be generated if not provided. All methods works with this name.
	 * @param {boolean} options.active - if true - timer is active (and will be started immediatly if this.start() was already called).
	 * @param {function} options.handler - timer's handler - function which called every time timer is fired. If options.isOnce is true - will be called once. Required.
	 * @param {boolean} options.isOnce - if true - after first timer's firing timer will be unregistered.
	 * @param {number} options.lastExecutionTimestamp - if timer was already fired in past this param should contain last execution timestamp (in ms) - it will be used to calculate correctly next execution time.
	 * @param {number} options.interval - timer's execution interval. In milliseconds. Required.
	 * @param {Object} options.context - context that will be provided to the timer's handler when it's executing.
	 * @throws Will throw an exception if there are no handler or interval provided in options.
	 */
	register(options) {
		let name = options.name || ('Timer #' + Math.random());
		let active = (typeof options.active !== 'undefined') ? options.active : true;
		if (!options.handler) {
			throw new Error('Timer can`t be without handler.')
		}
		let handler = options.handler;
		let isOnce = (typeof options.isOnce !== 'undefined') ? options.isOnce : false;
		let lastExecutionTimestamp = (typeof options.lastExecutionTimestamp !== 'undefined') ? options.lastExecutionTimestamp : null;
		if (!options.interval) {
			throw new Error('Timer can`t be without interval.')
		}
		let interval = options.interval;
		let context = options.context || null;

		let timer = {
			name,
			active,
			interval,
			handler,
			isOnce,
			lastExecutionTimestamp,
			context,
			currentTimeout: null
		};

		this.__timers[name] = timer;

		if (this.__isStarted && timer.active) {
			this.__continueTimerLifecycle(timer);
		}
		return this;
	}

	/**
	 * Unregisters timer and stops it if needed.
	 *
	 * @method
	 * @param {string} name - name of the timer.
	 */
	unregister(name) {
		let timer;
		if (typeof name === 'string') {
			timer = this.__checkExistenceAndGetByName(name);
		} else
		if (typeof name === 'function') {
			timer = this.__checkExistenceAndGetByHandler(name);
		}
		if (timer) {
			this.deactivate(timer.name);
			delete this.__timers[timer.name];
		}
		return this;
	}

	/**
	 * Starts the timer lifecycle.
	 *
	 * @method
	 * @param {string} name - name of the timer.
	 */
	activate(name) {
		let timer = this.__checkExistenceAndGetByName(name);
		if (timer.active) {
			return this;
		}
		timer.lastExecutionTimestamp = null;
		timer.active = true;
		if (this.__isStarted) {
			this.__continueTimerLifecycle(timer);
		}
		return this;
	}

	/**
	 * Pauses the timer lifecycle.
	 *
	 * @method
	 * @param {string} name - name of the timer.
	 */
	deactivate(name) {
		let timer = this.__checkExistenceAndGetByName(name);
		if (!timer.active) {
			return this;
		}
		if (timer.currentTimeout) {
			clearTimeout(timer.currentTimeout);
			timer.currentTimeout = null;
		}
		timer.active = false;
		return this;
	}

	/**
	 * If all event handlers and other staff is registered, timers states are restored,
	 * and we are ready to go at all - starts all registered timers lifecycles.
	 *
	 * @method
	 */
	start() {
		for (let name in this.__timers) {
			let timer = this.__timers[name];
			if (timer.active) {
				this.__continueTimerLifecycle(timer);
			}
		}
		this.__isStarted = true;
		return this;
	}

	/**
	 * Shortcut to register simple interval-based timer.
	 * Similar to simple JS setInterval.
	 *
	 * @method
	 * @param {string} name - name of the timer.
	 * @param {number} interval - interval of the timer.
	 * @param {function} handler - handler of the timer.
	 */
	interval(name, interval, handler) {
		this.register({
			name,
			interval,
			handler
		});
		return this;
	}

	/**
	 * Shortcut to register simple timer, that should be fired only once.
	 * Similar to simple JS setTimeout.
	 *
	 * @method
	 * @param {string} name - name of the timer.
	 * @param {number} interval - interval of the timer.
	 * @param {function} handler - handler of the timer.
	 */
	once(name, interval, handler) {
		this.register({
			name,
			interval,
			handler,
			isOnce: true
		});
		return this;
	}

	/**
	 * If handler is provided - registers it as default restoring function this.__onRestoreHandler.
	 * If not - trying to restore all inner state using this.__onRestoreHandler.
	 *
	 * @method
	 * @param {function} handler - async function that gets one param - this instance and should restore all it's inner state basing on anything (DB/Local Storage/etc.).
	 * @throws Will throw an exception if there are no restore handler, or if restore handler did not return promise.
	 */
	restore(handler = null) {
		if (handler) {
			this.__onRestoreHandler = handler;
			return this;
		}
		if (!this.__onRestoreHandler) {
			throw new Error('There is no registered function which can restore timers.')
		}
		let promise = this.__onRestoreHandler(this);
		if (!(promise instanceof Promise)) {
			throw new Error('Restore handler should always return promise.')
		}
		return promise.then(() => {
			return this;
		});
	}

	/**
	 * If handler is provided - registers it as default saving function this.__onSaveHandler.
	 * If not - trying to save all inner state using this.__onSaveHandler.
	 *
	 * @method
	 * @param {function} handler - async function that gets one param - this instance and should save all it's inner state in anywhere (DB/Local Storage/etc.).
	 * @throws Will throw an exception if there are no save handler, or if save handler did not return promise.
	 */
	save(handler = null) {
		if (handler) {
			this.__onSaveHandler = handler;
			return this;
		}
		if (!this.__onSaveHandler) {
			throw new Error('There is no registered function which can save timers.')
		}
		let promise = this.__onSaveHandler(this);
		if (!(promise instanceof Promise)) {
			throw new Error('Save handler should always return promise.')
		}
		return promise.then(() => {
			return this;
		});
	}

	/**
	 * Registers save/restore handlers from the given object.
	 *
	 * @method
	 * @param {Object} dataSource - object with two properties "save" and "restore" containing save and restore functions respectively. THIS OBJECT IS NOT USED AS A CONTEXT WHEN THIS FUNCTIONS ARE CALLED!
	 */
	assignDataSource(dataSource) {
		if (!dataSource.restore) {
			throw new Error('There is no restore method in dataSource.')
		}
		if (!dataSource.save) {
			throw new Error('There is no save method in dataSource.')
		}
		this.restore(dataSource.restore).save(dataSource.save);
		return this;
	}

}

/*
	TODO:
		native redis
		native amqp
		native memcached
		sequelize
		mongoose
*/

RobustTimers.DataSource = require('./dataSources');

if (typeof module !== 'undefined') {
	module.exports = RobustTimers;
}
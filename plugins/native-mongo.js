"use strict";

/**
 * RobustTimers plugin to save and restore timers states using native MongoDB module.
 *
 * npm repo: mongodb
 * install command: npm install mongodb
 * GitHub repo: https://github.com/mongodb/node-mongodb-native
 *
 * @param {Object} options - object containing options for dataSource.
 * @param {string} options.collectionName - name of collection containing data.
 * @param {string} options.nameColumn - name of column with timer name (unique).
 * @param {string} options.lastExecutionTimestampColumn - name of column with timer last execution timestamp (bigint).
 * @param {string} options.isOnceColumn - name of column with isOnce param (tinyint).
 * @param {string} options.activeColumn - name of column with active param (tinyint).
 */
function NativeMongoDB(db, options) {
	options = options || {};
	let collectionName = options.collectionName || 'timers';
	let nameColumn = options.nameColumn || 'name';
	let lastExecutionTimestampColumn = options.lastExecutionTimestampColumn || 'lastExecutionTimestamp';
	let isOnceColumn = options.isOnceColumn || 'isOnce';
	let activeColumn = options.activeColumn || 'active';
	return {
		save: (me) => {
			return new Promise((resolve, reject) => {
				let helpArray = [];
				let sql = "";
				for (let name in me.__timers) {
					let timer = me.__timers[name];
					helpArray.push({
						name: timer.name,
						lastExecutionTimestamp: timer.lastExecutionTimestamp,
						isOnce: timer.isOnce,
						active: timer.active
					});
				}
				db.collection(collectionName).then(col => {
					let instructions = [];
					for (let timer of helpArray) {
						instructions.push({
							updateOne: {
								filter: {
									[nameColumn]: timer.name
								},
								update: {
									$set: {
										[nameColumn]: timer.name,
										[lastExecutionTimestampColumn]: timer.lastExecutionTimestamp,
										[isOnceColumn]: timer.isOnce,
										[activeColumn]: timer.active,
									}
								},
								upsert: true
							}
						});
					}
					col.bulkWrite(instructions, {ordered: false}).then(() => {
						resolve();
					}).catch(reject);
				}).catch(reject);
			});
		},
		restore: (me) => {
			return new Promise((resolve, reject) => {
				let helpArray = [];
				db.collection(collectionName).then(col => {
					col.find().toArray().then((rows) => {
						for (let timerDesc of rows) {
							if (me.__timers[timerDesc[nameColumn]]) {
								me.__timers[timerDesc[nameColumn]].lastExecutionTimestamp = parseInt(timerDesc[lastExecutionTimestampColumn]);
								me.__timers[timerDesc[nameColumn]].isOnce = !!parseInt(timerDesc[isOnceColumn]);
								me.__timers[timerDesc[nameColumn]].active = !!parseInt(timerDesc[activeColumn]);
							}
						}
						resolve();
					}).catch(reject);
				}).catch(reject);
			});
		}
	}
}

module.exports = NativeMongoDB;
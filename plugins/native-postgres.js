"use strict";

/**
 * RobustTimers plugin to save and restore timers states using native PostgreSQL module.
 *
 * npm repo: pg
 * install command: npm install pg
 * GitHub repo: https://github.com/brianc/node-postgres
 *
 * @param {Object} options - object containing options for dataSource.
 * @param {string} options.tableName - name of table containing data.
 * @param {string} options.nameColumn - name of column with timer name (unique).
 * @param {string} options.lastExecutionTimestampColumn - name of column with timer last execution timestamp (bigint).
 * @param {string} options.isOnceColumn - name of column with isOnce param (tinyint).
 * @param {string} options.activeColumn - name of column with active param (tinyint).
 */
function NativePostgreSQL(conn, options) {
	options = options || {};
	let tableName = options.tableName || 'timers';
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
  				sql += "INSERT INTO \"" + tableName + "\" (\"" + nameColumn + "\", \"" + lastExecutionTimestampColumn + "\", \"" + isOnceColumn + "\", \"" + activeColumn + "\") VALUES ";
  				let values = [];
				for (let timer of helpArray) {
					values.push("(" + conn.escape(timer.name) + ", " + conn.escape(timer.lastExecutionTimestamp) + ", " + conn.escape(timer.isOnce ? 1 : 0) + ", " + conn.escape(timer.active ? 1 : 0) + ")");
				}
				sql += values.join(', ');
				sql += " ON CONFLICT (\"" + nameColumn + "\") DO UPDATE ";
				sql += "\"" + nameColumn + "\" = EXCLUDED.\"" + nameColumn + "\", ";
				sql += "\"" + lastExecutionTimestampColumn + "\" = EXCLUDED.\"" + lastExecutionTimestampColumn + "\", ";
				sql += "\"" + isOnceColumn + "\" = EXCLUDED.\"" + isOnceColumn + "\", ";
				sql += "\"" + activeColumn + "\" = EXCLUDED.\"" + activeColumn + "\"";
				conn.query(sql, (err, result) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			});
		},
		restore: (me) => {
			return new Promise((resolve, reject) => {
				let helpArray = [];
				let sql = "SELECT \"" + nameColumn + "\" as \"name\", \"" + lastExecutionTimestampColumn + "\" as \"lastExecutionTimestamp\", \"" + isOnceColumn + "\" as \"isOnce\", \"" + activeColumn + "\" as \"active\" FROM \"" + tableName + "\"";
				conn.query(sql, (err, result) => {
					if (err) {
						return reject(err);
					}
					let rows = result.rows;
					for (let timerDesc of rows) {
						if (me.__timers[timerDesc.name]) {
							me.__timers[timerDesc.name].lastExecutionTimestamp = parseInt(timerDesc.lastExecutionTimestamp);
							me.__timers[timerDesc.name].isOnce = !!parseInt(timerDesc.isOnce);
							me.__timers[timerDesc.name].active = !!parseInt(timerDesc.active);
						}
					}
					resolve();
				});
			});
		}
	}
}

module.exports = NativePostgreSQL;
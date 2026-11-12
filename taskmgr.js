export class TaskManager {
	constructor() {
		this.#initWatchdog();
	}

	// Task info
	#tasks = {};
	get #newTaskObject() {
		return {
			created: Date.now(),
			active: true,
		};
	}

	// Task management
	addTask(name) {
		name ??= `Unnamed task ${Object.keys(this.#tasks).length}`;
		this.#tasks[name] = this.#newTaskObject;
		return name;
	}
	removeTask(name) {
		if (this.#tasks[name] == null)
			return false;
			// throw new ReferenceError(`Unknown task "${name}"`);
		this.#tasks[name].active = false;
		this.#tasks[name].deactivated = Date.now();
		this.#tasks[name].deletionTime = 30e3 - (Date.now() - this.#lastWatchdogTaskExec.clearInactiveTasks);
		return true;
	}

	// Watchdog
	#watchdogIntervals = {};
	#lastWatchdogTaskExec = {};
	#initWatchdog() {
		const watchdogTasks = {
			clearInactiveTasks: {
				fn() {
					const inactiveTasks = Object.entries(this.#tasks).filter(t => !t[1].active);
					inactiveTasks.forEach(t => delete this.#tasks[t[0]]);
				},
				interval: 30e3,
			},
		};
		for (const [name, info] of Object.entries(watchdogTasks)) {
			const intervalFn = () => {
				info.fn.call(this);
				this.#lastWatchdogTaskExec[name] = Date.now();
			}, interval = setInterval(intervalFn, info.interval);
			this.#watchdogIntervals[name] = interval;
			intervalFn();
			// console.debug(`[Watchdog] Initialized task "${name}"`);
		}
	}

	// State
	get taskCount() {
		return Object.values(this.tasks).filter(t => t.active).length;
	}
	get isWorking() {
		return this.taskCount > 0;
	}
	get state() {
		if (this.isWorking) return 'working';
		else return 'idle';
	}
	get tasks() {
		return this.#tasks;
	}
}

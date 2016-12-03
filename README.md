<a name="RobustTimers"></a>

[Documentation: https://elkornacio.github.io/Robust-Timers/](https://elkornacio.github.io/Robust-Timers/)

## Installation

```sh
$ npm install robust-timers
```

## RobustTimers
Simple class used for multiple purposes regarding to timers.
Except obvious functions like registering, unregistering timers,
you can easily save and restore timers states, register "once" timers,
activate and deactivate registered timers, provide your own handlers
to serialize/unseriaize and save/restore timer states.

All functions (except asynchronous) returns context to provide fluent
interface pattern.

Meant that this class will be used as singleton, but it's up to you and yours
app's architecture.

**Kind**: global class  

* [RobustTimers](#RobustTimers)
    * [new RobustTimers(options)](#new_RobustTimers_new)
    * [.register(options)](#RobustTimers+register)
    * [.unregister(name)](#RobustTimers+unregister)
    * [.activate(name)](#RobustTimers+activate)
    * [.deactivate(name)](#RobustTimers+deactivate)
    * [.start()](#RobustTimers+start)
    * [.interval(name, interval, handler)](#RobustTimers+interval)
    * [.once(name, interval, handler)](#RobustTimers+once)
    * [.restore(handler)](#RobustTimers+restore)
    * [.save(handler)](#RobustTimers+save)
    * [.assignDataSource(dataSource)](#RobustTimers+assignDataSource)

<a name="new_RobustTimers_new"></a>

### new RobustTimers(options)
Just constructor.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | object containing options for construction. |
| options.start | <code>boolean</code> | if true - calls this.start() at the end of construction. |
| options.restoreAndStart | <code>boolean</code> | if true - calls this.restore() and after restoring states calls this.start(). Use only makes sense in combination with the provided options.dataSource param. |
| options.dataSource | <code>Object</code> | data source object. You can see object description at this.assignDataSource() method. |

<a name="RobustTimers+register"></a>

### robustTimers.register(options)
Registers new timer and runs it if needed.

**Kind**: instance method of <code>[RobustTimers](#RobustTimers)</code>  
**Throws**:

- Will throw an exception if there are no handler or interval provided in options.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | object containing options of timer. |
| options.name | <code>string</code> | name of the timer. Unique. Will be generated if not provided. All methods works with this name. |
| options.active | <code>boolean</code> | if true - timer is active (and will be started immediatly if this.start() was already called). |
| options.handler | <code>function</code> | timer's handler - function which called every time timer is fired. If options.isOnce is true - will be called once. Required. |
| options.isOnce | <code>boolean</code> | if true - after first timer's firing timer will be unregistered. |
| options.lastExecutionTimestamp | <code>number</code> | if timer was already fired in past this param should contain last execution timestamp (in ms) - it will be used to calculate correctly next execution time. |
| options.interval | <code>number</code> | timer's execution interval. In milliseconds. Required. |
| options.context | <code>Object</code> | context that will be provided to the timer's handler when it's executing. |

<a name="RobustTimers+unregister"></a>

### robustTimers.unregister(name)
Unregisters timer and stops it if needed.

**Kind**: instance method of <code>[RobustTimers](#RobustTimers)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the timer. |

<a name="RobustTimers+activate"></a>

### robustTimers.activate(name)
Starts the timer lifecycle.

**Kind**: instance method of <code>[RobustTimers](#RobustTimers)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the timer. |

<a name="RobustTimers+deactivate"></a>

### robustTimers.deactivate(name)
Pauses the timer lifecycle.

**Kind**: instance method of <code>[RobustTimers](#RobustTimers)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the timer. |

<a name="RobustTimers+start"></a>

### robustTimers.start()
If all event handlers and other staff is registered, timers states are restored,
and we are ready to go at all - starts all registered timers lifecycles.

**Kind**: instance method of <code>[RobustTimers](#RobustTimers)</code>  
<a name="RobustTimers+interval"></a>

### robustTimers.interval(name, interval, handler)
Shortcut to register simple interval-based timer.
Similar to simple JS setInterval.

**Kind**: instance method of <code>[RobustTimers](#RobustTimers)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the timer. |
| interval | <code>number</code> | interval of the timer. |
| handler | <code>function</code> | handler of the timer. |

<a name="RobustTimers+once"></a>

### robustTimers.once(name, interval, handler)
Shortcut to register simple timer, that should be fired only once.
Similar to simple JS setTimeout.

**Kind**: instance method of <code>[RobustTimers](#RobustTimers)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the timer. |
| interval | <code>number</code> | interval of the timer. |
| handler | <code>function</code> | handler of the timer. |

<a name="RobustTimers+restore"></a>

### robustTimers.restore(handler)
If handler is provided - registers it as default restoring function this.__onRestoreHandler.
If not - trying to restore all inner state using this.__onRestoreHandler.

**Kind**: instance method of <code>[RobustTimers](#RobustTimers)</code>  
**Throws**:

- Will throw an exception if there are no restore handler, or if restore handler did not return promise.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| handler | <code>function</code> | <code></code> | async function that gets one param - this instance and should restore all it's inner state basing on anything (DB/Local Storage/etc.). |

<a name="RobustTimers+save"></a>

### robustTimers.save(handler)
If handler is provided - registers it as default saving function this.__onSaveHandler.
If not - trying to save all inner state using this.__onSaveHandler.

**Kind**: instance method of <code>[RobustTimers](#RobustTimers)</code>  
**Throws**:

- Will throw an exception if there are no save handler, or if save handler did not return promise.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| handler | <code>function</code> | <code></code> | async function that gets one param - this instance and should save all it's inner state in anywhere (DB/Local Storage/etc.). |

<a name="RobustTimers+assignDataSource"></a>

### robustTimers.assignDataSource(dataSource)
Registers save/restore handlers from the given object.

**Kind**: instance method of <code>[RobustTimers](#RobustTimers)</code>  

| Param | Type | Description |
| --- | --- | --- |
| dataSource | <code>Object</code> | object with two properties "save" and "restore" containing save and restore functions respectively. THIS OBJECT IS NOT USED AS A CONTEXT WHEN THIS FUNCTIONS ARE CALLED! |


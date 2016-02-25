'use strict';

function asyncCall(fn) {
	return setTimeout(fn, 0)
}

function isFunction(value) {
	return typeof value == "function"
}

function isObject(value) {
	return typeof value == "object"
}

function excute(handler, value, next, reject) {
	try {
		var x = handler(value)
		resolvePromise(next, x)
	} catch (e) {
		return reject(e)
	}
}

function resolvePromise(promise, x) {
	//promise解析流程
	var then
	var called = false;
	if (promise === x) {
		//如果promise 和 x 指向相同的值, 使用 TypeError做为原因将promise拒绝。
		return reject(promise, new TypeError("promise and x is same"))
	} else if (x instanceof Promise) {
		//如果 x 是一个promise
		if (x.state == "pending") {
			//todo
			x.then(function(v) {
				resolvePromise(promise, v)
			}, function(reason) {
				reject(promise, reason)
			})
		} else {
			x.then(function(value) {
				resolve(promise, value)
			}, function(reason) {
				reject(promise, reason)
			})
		}
	} else if ((x !== null) && (isFunction(x) || isObject(x))) {
		//thenable
		try {
			then = x.then;
			if (isFunction(then)) {
				then.call(x, function(y) {
					if (called) return
					called = true
					return resolvePromise(promise, y)
				}, function(r) {
					if (called) return
					called = true
					return reject(promise, r)
				})
			} else {
				return resolve(promise, x)
			}
		} catch (e) {
			if (called) return
			called = true
			return reject(promise, e)
		}
	} else {
		return resolve(promise, x)
	}
}

function Promise(resolver) {
	if (!isFunction(resolver)) {
		throw new TypeError('not a function');
	}
	//pending fulfilled rejected
	var self = this;
	self.state = "pending";
	self.callbacks = [];
	try {
		resolver(function(value) {
			resolve(self, value)
		}, function(reason) {
			reject(self, reason)
		});
	} catch (e) {
		reject(self, value)
	}
}

function resolve(promise, value) {
	asyncCall(function() {
		if (promise.state != "pending") return
		promise.state = "fullfilled"
		promise.data = value
		for (var i = 0; i < promise.callbacks.length; i++) {
			var handler = promise.callbacks[i]._onFulfillQueue;
			handler(value)
		}
	})
}

function reject(promise, reason) {
	asyncCall(function() {
		if (promise.state != "pending") return
		promise.state = "rejected"
		promise.data = reason
		for (var i = 0; i < promise.callbacks.length; i++) {
			var handler = promise.callbacks[i]._onRejectQueue;
			handler(reason)
		}
	})
}
Promise.prototype.then = function(onFulfilled, onRejected) {
	onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function(v) {
		return v
	}
	onRejected = typeof onRejected === 'function' ? onRejected : function(r) {
		throw r
	}
	var self = this
	var promise2
	return promise2 = new Promise(function(resolve, reject) {

		if (self.state === 'fullfilled') {
			asyncCall(function() {
				excute(onFulfilled, self.data, promise2, reject)
			})
		}
		if (self.state === 'rejected') {
			asyncCall(function() {
				excute(onRejected, self.data, promise2, reject)
			})
		}
		if (self.state === 'pending') {

			self.callbacks.push({
				_onFulfillQueue: function(value) {
					excute(onFulfilled, value, promise2, reject)
				},
				_onRejectQueue: function(reason) {
					excute(onRejected, reason, promise2, reject)

				}
			})
		}
	})
}
Promise.resolve = function(value) {
	return new Promise(function(resolve) {
		resolve(value)
	})
}

Promise.reject = function(reason) {
	return new Promise(function(resolve, reject) {
		reject(reason)
	})
}
Promise.deferred = function() {
	var resolve, reject;
	var promise = new Promise(function(_resolve, _reject) {
		resolve = _resolve;
		reject = _reject;
	});
	return {
		promise: promise,
		resolve: resolve,
		reject: reject
	};
}

module.exports = Promise

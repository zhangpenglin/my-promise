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

function excute(handler, value, nextPromise) {
	try {
		var x = handler(value)
		resolvePromise(nextPromise, x)
	} catch (e) {
		return nextPromise.reject(e)
	}
}

function resolvePromise(promise, x) {
	var resolve=resolve.bind(promise);
	var reject=resolve.bind(promise);
	//promise解析流程
	var then
	var called = false;
	if (promise === x) {
		//如果promise 和 x 指向相同的值, 使用 TypeError做为原因将promise拒绝。
		reject(new TypeError("promise and x is same"))
	} else if (x instanceof Promise) {
		//如果 x 是一个promise
		if (x.state == "pending") {
			//todo
			x.then(function(v) {
				resolvePromise(promise, v)
			}, reject)
		} else {
			x.then(resolve, reject)
		}
	} else if (isFunction(x) || isObject(x)) {
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
					return reject(r)
				})
			} else {
				return resolve(x)
			}
		} catch (e) {
			if (called) return
			called = true
			return reject(e)
		}
	} else {
		return resolve(x)
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
	resolver(self.resolve.bind(self), self.reject.bind(self));
}
Promise.prototype.resolve = function (value) {
	var self=this;
	setTimeout(function() {
		if (self.state != "pending") return
		self.state = "fullfilled"
		self.data = value
		for (var i = 0; i < self.callbacks.length; i++) {
			var handler = self.callbacks[i]._onFulfillQueue;
			handler(value)
		}
	})
}
Promise.prototype.reject = function(reason) {
		var self=this;
	setTimeout(function() {
		if (self.state != "pending") return
		self.state = "rejected"
		self.data = reason
		for (var i = 0; i < self.callbacks.length; i++) {
			var handler = self.callbacks[i]._onRejectQueue;
			handler(reason)
		}
	})
}
Promise.prototype.then = function(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function(v){return v}
    onRejected = typeof onRejected === 'function' ? onRejected : function(r){throw r}
    var self = this
    var promise2

    if (self.state === 'fullfilled') {
      return promise2 = new Promise(function(resolve, reject) {
        setTimeout(function() {
          try {
            var value = onFulfilled(self.data)
            resolvePromise(promise2, value)
          } catch(e) {
            return reject(e)
          }
        })
      })
    }

    if (self.state === 'rejected') {
      return promise2 = new Promise(function(resolve, reject) {
        setTimeout(function() {
          try {
            var value = onRejected(self.data)
            resolvePromise(promise2, value)
          } catch(e) {
            return reject(e)
          }
        })
      })
    }

    if (self.state === 'pending') {
      return promise2 = new Promise(function(resolve, reject) {
        self.callbacks.push({
          _onFulfillQueue: function(value) {
            try {
              var value = onFulfilled(value)
              resolvePromise(promise2, value)
            } catch(e) {
              return reject(e)
            }
          },
          _onRejectQueue: function(reason) {
            try {
              var value = onRejected(reason)
              resolvePromise(promise2, value)
            } catch(e) {
              return reject(e)
            }
          }
        })
        
      })
    }
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

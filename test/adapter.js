var Promise=require("../index.js");
var reject,resolve;
exports.deferred = function() {
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
exports.reject=Promise.reject;
exports.resolve=Promise.resolve;

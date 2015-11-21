module.exports = function concurrentPromiseQueue(collection, transform, concurrencyLimit, PromiseImpl){

	var
	isArray = Array.isArray || function(el){ return Object.prototype.toString.call(el) === '[object Array]'; }
	, LocalPromise = PromiseImpl || global.Promise;

	if (!LocalPromise){
		throw new Error('niagara could not find Promise implementation');
	}

	collection = Array.prototype.slice.call(collection);
	concurrencyLimit = concurrencyLimit || 8;

	return new LocalPromise(function(resolve, reject){

		var results = [], i = -1, j, next;

		function processElements(){
			if (++i < collection.length){
				try {
					next = transform(collection[i]);
					results.push(next);
					return LocalPromise.resolve(next);
				} catch (err) {
					next = LocalPromise.reject(err);
					results.push(next);
					return LocalPromise.resolve();
				}
			}
			return results;
		}

		function recurse(){
			var nextValue = processElements();
			if (nextValue && nextValue.then){
				nextValue.then(recurse);
			} else if (isArray(nextValue)){
				resolve(LocalPromise.all(nextValue));
			}
		}

		for (j = 0; j < Math.min(concurrencyLimit, collection.length); j++){
			recurse();
		}

	});

};

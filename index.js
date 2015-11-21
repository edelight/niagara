module.exports = function concurrentPromiseQueue(collection, transform, concurrencyLimit, PromiseImpl){

	var
	isPromise = function(el) {
  		return !!el && (typeof el === 'object' || typeof el === 'function') && typeof el.then === 'function';
	}
	, LocalPromise = PromiseImpl || (global && global.Promise);

	if (!LocalPromise){
		throw new Error('niagara could not find Promise implementation');
	}

	collection = Array.prototype.slice.call(collection);
	concurrencyLimit = concurrencyLimit || 8;

	return new LocalPromise(function(resolve, reject){

		var results = [], i = -1, j;

		function processNext(){
			var next;
			if (++i < collection.length){
				try {
					next = transform(collection[i]);
					results.push(next);
				} catch (err) {
					next = LocalPromise.reject(err);
					results.push(next);
				} finally {
					return LocalPromise.resolve(next);
				}
			}
			return results;
		}

		function recurse(){
			var nextValue = processNext();
			if (isPromise(nextValue)){
				nextValue.then(recurse).catch(recurse);
			} else {
				resolve(LocalPromise.all(nextValue));
			}
		}

		for (j = 0; j < Math.min(concurrencyLimit, collection.length); j++){
			recurse();
		}

	});

};

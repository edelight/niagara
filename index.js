function isFunction(el){
	return Object.prototype.toString.call(el) === '[object Function]';
}

function Niagara(PromiseImpl){

	PromiseImpl = PromiseImpl || (global && global.PromiseImpl);

	if (!PromiseImpl.all || !PromiseImpl.resolve || !(PromiseImpl.resolve().then)){
		throw new Error('Unable to use passed Promise implementation');
	}

	this.queue = function(collection, transform, concurrencyLimit){

		collection = [].slice.call(collection);
		concurrencyLimit = concurrencyLimit || 8;

		if (collection.length <= concurrencyLimit){
			return PromiseImpl.all(collection.map(transform));
		} else {
			return new PromiseImpl(function(resolve, reject){

				var
				doneItems = 0
				, thunks = []
				, results = []
				, initialBatch;

				function thunkify(fn, el, index){
					return function(){
						return fn.call(fn, el).then(function(result){
							results[index] = result;
							doneItems++;
							if (doneItems === collection.length){
								resolve(results);
							}
						});
					};
				}

				function processNext(){
					var next = thunks.splice(0, 1)[0];
					if (isFunction(next)){
						next()
							.then(processNext)
							.catch(reject);
					}
				}

				thunks = collection.map(thunkify.bind(null, transform));
				initialBatch = thunks.splice(0, concurrencyLimit);

				initialBatch.forEach(function(thunk){
					thunk()
						.then(processNext)
						.catch(reject);
				});


			});
		}
	};

}

module.exports = Niagara;

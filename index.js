function isPromise(el){
	return !!el && (typeof el === 'object' || typeof el === 'function') && typeof el.then === 'function';
}

function uid(){
  return Math.random().toString(35).substr(2, 7);
}

function Niagara(collection, opts){
	if (!Array.isArray(collection)){
		throw new Error('Expected an Array!');
	}
	if (this instanceof Niagara){
		this._collection = collection;
		opts = opts || {};
		this.limit = opts.limit || null;
		this.Promise = opts.Promise
			|| (typeof global !== 'undefined' && global.Promise)
			|| (typeof window !== 'undefined' && window.Promise);
		this._rejectionSymbol = uid();
	} else {
		return new Niagara(collection, opts);
	}
}

Niagara.prototype._iterate = function(transform, thisArg, filter){

	var self = this;
	transform = thisArg ? transform.bind(thisArg) : transform;

	return new this.Promise(function(resolve, reject){

		var
		limit = Math.min((self.limit || self._collection.length), self._collection.length)
		, results = []
		, i = -1
		, j
		, processNext = function(){
			var next;
			if (++i < self._collection.length){
				try {
					next = transform(self._collection[i], i, self._collection);
					results.push(self.Promise.resolve(next));
				} catch (err) {
					next = self.Promise.reject(err);
					results.push(next);
				} finally {
					return self.Promise.resolve(next);
				}
			}
			return results;
		}
		, recurse = function(){
			var nextValue = processNext();
			if (isPromise(nextValue)){
				nextValue.then(recurse).catch(recurse);
			} else {
				nextValue = nextValue.map(function(res){
					return new self.Promise(function(resolve, reject){
						res.then(resolve).catch(function(err){
							if (filter){
								resolve(self._rejectionSymbol);
							} else {
								reject(err);
							}
						});
					});
				});
				resolve(this.Promise.all(nextValue));
			}
		};

		for (j = 0; j < limit; j++){
			recurse();
		}
		if (limit < 1){
			resolve(self._collection);
		}

	});

};

Niagara.prototype.map = function(transform, thisArg){
	return this._iterate(transform, thisArg, false);
};

Niagara.prototype.filter = function(predicate, thisArg){
	var self = this;
	return this._iterate(predicate, thisArg, true).then(function(results){
		return results.filter(function(result){
			return result !== self._rejectionSymbol;
		});
	});
};

module.exports = Niagara;

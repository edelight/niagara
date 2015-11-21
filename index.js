function Niagara(collection, opts){
	if (Object.prototype.toString.call(collection) !== '[object Array]'){
		throw new Error('Expected an Array!');
	}
	if (this instanceof Niagara){
		this._collection = collection;
		opts = opts || {};
		this.limit = opts.limit || null;
		this.Promise = opts.Promise || (global && global.Promise) || (window && window.Promise);
	} else {
		return new Niagara(collection, opts);
	}
}

Niagara.prototype.map = function(transform, thisArg){

	var isPromise = function(el) {
  		return !!el && (typeof el === 'object' || typeof el === 'function') && typeof el.then === 'function';
	};

	transform = thisArg ? transform.bind(thisArg) : transform;

	return new this.Promise(function(resolve, reject){

		var
		limit = Math.min((this.limit || this._collection.length), this._collection.length)
		, results = []
		, i = -1
		, j
		, processNext = function(){
			var next;
			if (++i < this._collection.length){
				try {
					next = transform(this._collection[i], i, this._collection);
					results.push(next);
				} catch (err) {
					next = this.Promise.reject(err);
					results.push(next);
				} finally {
					return this.Promise.resolve(next);
				}
			}
			return results;
		}.bind(this)
		, recurse = function(){
			var nextValue = processNext();
			if (isPromise(nextValue)){
				nextValue.then(recurse).catch(recurse);
			} else {
				resolve(this.Promise.all(nextValue));
			}
		};


		for (j = 0; j < limit; j++){
			recurse();
		}

		if (limit < 1){
			resolve(this._collection);
		}

	}.bind(this));

};

module.exports = Niagara;

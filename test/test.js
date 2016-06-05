var assert = require('assert');
var Promise = require('promise');
var _ = require('underscore');

var Niagara = require('./../index.js');

global.Promise = Promise;

var currentlyRunning = 0;
var maxRunning = 0;

function delayValue(value){
	return new Promise(function(resolve, reject){
		currentlyRunning++;
		maxRunning = Math.max(maxRunning, currentlyRunning);
		setTimeout(function(){
			currentlyRunning--;
			resolve(value);
		}, Math.floor(Math.random() * 500));
	});
}

function rejectZalgo(value){
	return new Promise(function(resolve, reject){
		if (value === 'zalgo'){
			reject(new Error('Zalgo not allowed'));
		} else {
			resolve(value);
		}
	});
}

function identity(value){
	return value;
}

function sometimesAsync(value, index){
	return index % 2 === 0 ? value : delayValue(value);
}

function returnIndex(value, index){
	return delayValue(index);
}

function returnCollection(value, index, collection){
	return delayValue(collection);
}

function syncError(value){
	if (value === 'zalgo'){
		throw new Error('Zalgo not allowed');
	} else {
		return value;
	}
}

function addThisProp(value){
	return delayValue(value + this.prop);
}

var values = _.map(_.range(34), function(){ return 'some-value'; });
var wrappedValues = _.map(_.range(34), function(){ return ['zalgo']; });
var singleValue = ['lonesome'];

describe('Niagara', function(){
	it('can be called without using the new keyword', function(){
		var n = Niagara([1]);
		assert(n instanceof Niagara);
	});
	it('can be called using the new keyword', function(){
		var n = new Niagara([2, 3]);
		assert(n instanceof Niagara);
	});
	it('exposes a map method', function(){
		var n = new Niagara([2, 3]);
		assert(n.map);
		assert(_.isFunction(n.map));
	});
	it('exposes a filter method', function(){
		var n = new Niagara([2, 3]);
		assert(n.filter);
		assert(_.isFunction(n.filter));
	});
	it('throws when being passed undefined', function(){
		assert.throws(function(){
			Niagara();
		});
	});
	it('throws when being passed something that is not an array', function(){
		assert.throws(function(){
			Niagara({foo: 'bar'});
		});
	});
	it('can be passed a promise implementation to use as a default value', function(){
		assert(_.isFunction(Niagara.setPromise));
		assert.doesNotThrow(function(){
			Niagara.setPromise(Promise);
		});
	});
});

describe('#map', function(){
	this.timeout(25000);
	it('maps a collection against an async function', function(){
		return Niagara(values).map(delayValue).then(function(result){
			assert.deepEqual(result, values);
		});
	});
	it('keeps data integrity', function(){
		return Niagara(wrappedValues).map(delayValue).then(function(result){
			assert.deepEqual(result, wrappedValues);
		});
	});
	it('can handle the empty list', function(){
		return Niagara([]).map(delayValue).then(function(result){
			assert.deepEqual(result, []);
		});
	});
	it('handles collections of a single item properly', function(){
		return Niagara(singleValue).map(delayValue).then(function(result){
			assert.deepEqual(result, singleValue);
		});
	});
	it('does not use a concurrency limit by default', function(){
		currentlyRunning = 0;
		maxRunning = 0;
		return Niagara(values).map(delayValue).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(values.length, maxRunning);
		});
	});
	it('respects the given concurrency threshold, given 8', function(){
		var limit = 3;
		currentlyRunning = 0;
		maxRunning = 0;
		return Niagara(values, { limit: limit }).map(delayValue).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(limit, maxRunning);
		});
	});
	it('respects the given concurrency threshold, given 3', function(){
		var limit = 3;
		currentlyRunning = 0;
		maxRunning = 0;
		return Niagara(values, { limit: limit }).map(delayValue).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(limit, maxRunning);
		});
	});
	it('respects the given concurrency threshold, given 1', function(){
		var limit = 1;
		currentlyRunning = 0;
		maxRunning = 0;
		return Niagara(values, { limit: limit }).map(delayValue).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(limit, maxRunning);
		});
	});
	it('respects the given concurrency threshold, given a number too large', function(){
		var limit = 12;
		var values = ['a', 'b'];
		currentlyRunning = 0;
		maxRunning = 0;
		return Niagara(values, { limit: limit }).map(delayValue).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(values.length, maxRunning);
		});
	});
	it('can handle synchronous return values', function(){
		return Niagara(values).map(identity).then(function(result){
			assert.deepEqual(result, values);
		});
	});
	it('passes the correct element index to the transform', function(){
		var letters = ['a','b','c'];
		return Niagara(letters).map(returnIndex).then(function(result){
			assert.deepEqual(result, [0, 1, 2]);
		});
	});
	it('passes the correct collection parameter to the transform', function(){
		var letters = ['a','b','c'];
		return Niagara(letters).map(returnCollection).then(function(result){
			assert.deepEqual(result[0], letters);
			assert.deepEqual(result[1], letters);
			assert.deepEqual(result[2], letters);
		});
	});
	it('can be passed a context to bind the transform against', function(){
		var numbers = [0, 1, 2];
		var thisArg = { prop: 2 };
		return Niagara(numbers).map(addThisProp, thisArg).then(function(result){
			assert.deepEqual(result, [2, 3, 4]);
		});
	});
	it('propagates rejections correctly', function(){
		var strings = ['foo', 'zalgo', 'bar', 'zalgo'];
		return Niagara(strings).map(rejectZalgo).then(function(){
				assert(false);
			})
			.catch(function(err){
				assert(err);
				assert.equal(err.message, 'Zalgo not allowed');
			});
	});
	it('properly handles synchronous errors', function(){
		var strings = ['foo', 'bar', 'zalgo'];
		return Niagara(strings).map(syncError).then(function(res){
				assert(false);
			})
			.catch(function(err){
				assert(err);
				assert.equal(err.message, 'Zalgo not allowed');
			});
	});
	it('can handle synchronous and asynchronous return values in the same queue', function(){
		return Niagara(values).map(sometimesAsync).then(function(result){
			assert.deepEqual(result, values);
		});
	});
});

describe('#filter', function(){
	this.timeout(25000);
	it('filters out rejected promises', function(){
		var strings = ['foo', 'zalgo', 'bar', 'zalgo'];
		return Niagara(strings).filter(rejectZalgo).then(function(result){
			assert.deepEqual(result, ['foo', 'bar']);
		});
	});
	it('returns the empty list when all transforms yielded rejections', function(){
		var strings = ['zalgo', 'zalgo', 'zalgo', 'zalgo'];
		return Niagara(strings).filter(rejectZalgo).then(function(result){
			assert.deepEqual(result, []);
		});
	});
	it('properly handles synchronous errors', function(){
		var strings = ['foo', 'bar', 'zalgo'];
		return Niagara(strings).filter(syncError).then(function(result){
			assert.deepEqual(result, ['foo', 'bar']);
		});
	});
	it('behaves like map when all results are resolved', function(){
		return Niagara(values).filter(delayValue).then(function(result){
			assert.deepEqual(result, values);
		});
	});
	it('respects the given concurrency threshold, given 3', function(){
		var limit = 3;
		currentlyRunning = 0;
		maxRunning = 0;
		return Niagara(values, { limit: limit }).filter(delayValue).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(limit, maxRunning);
		});
	});
	it('passes the correct element index to the transform', function(){
		var letters = ['a','b','c'];
		return Niagara(letters).filter(returnIndex).then(function(result){
			assert.deepEqual(result, [0, 1, 2]);
		});
	});
	it('passes the correct collection parameter to the transform', function(){
		var letters = ['a','b','c'];
		return Niagara(letters).filter(returnCollection).then(function(result){
			assert.deepEqual(result[0], letters);
			assert.deepEqual(result[1], letters);
			assert.deepEqual(result[2], letters);
		});
	});
	it('can be passed a context to bind the transform against', function(){
		var numbers = [0, 1, 2];
		var thisArg = { prop: 2 };
		return Niagara(numbers).filter(addThisProp, thisArg).then(function(result){
			assert.deepEqual(result, [2, 3, 4]);
		});
	});

});

var assert = require('assert');
var Promise = require('promise');

var _ = require('underscore');

var Promise = require('promise');
var Niagara = require('./../index.js');

var niagara = new Niagara(Promise);

var currentlyRunning = 0;
var maxRunning = 0;

function delayValue(value){
	return new Promise(function(resolve, reject){
		currentlyRunning++;
		maxRunning = Math.max(maxRunning, currentlyRunning);
		setTimeout(function(){
			currentlyRunning--;
			resolve(value);
		}, Math.floor(Math.random() * 1000));
	});
}

var values = _.map(_.range(34), function(){ return 'some-value'; });
var wrappedValues = _.map(_.range(34), function(){ return ['zalgo']; });
var singleValue = ['lonesome'];

describe('Niagara', function(){
	it('instantiates properly when being passed a promise implementation', function(){
		var instance = new Niagara(Promise);
		assert(instance);
	});
	it('throws when unable to use the passed Promise implementation', function(){
		assert.throws(function(){
			var instance = new Niagara({ nope: true });
		});
		assert.throws(function(){
			var instance = new Niagara('string');
		});
	});
});

describe('Niagara instance', function(){
	it('exposes a `queue` method', function(){
		var instance = new Niagara(Promise);
		assert(instance.queue);
		assert(_.isFunction(instance.queue));
		assert.equal(instance.queue.length, 3);
	});

});

describe('#queue', function(){
	this.timeout(25000);
	it('maps a collection against a promise returning function', function(){
		return niagara.queue(values, delayValue).then(function(result){
			assert.deepEqual(result, values);
		});
	});
	it('keeps data integrity', function(){
		return niagara.queue(wrappedValues, delayValue).then(function(result){
			assert.deepEqual(result, wrappedValues);
		});
	});
	it('handles collections of a single item properly', function(){
		return niagara.queue(singleValue, delayValue).then(function(result){
			assert.deepEqual(result, singleValue);
		});
	});
	it('respects the default concurrency threshold of 8', function(){
		currentlyRunning = 0;
		maxRunning = 0;
		return niagara.queue(values, delayValue).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(8, maxRunning);
		});
	});
	it('respects the given concurrency threshold, given 3', function(){
		currentlyRunning = 0;
		maxRunning = 0;
		var limit = 3;
		return niagara.queue(values, delayValue, limit).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(limit, maxRunning);
		});
	});
	it('respects the given concurrency threshold, given 1', function(){
		currentlyRunning = 0;
		maxRunning = 0;
		var limit = 1;
		return niagara.queue(values, delayValue, limit).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(limit, maxRunning);
		});
	});
});

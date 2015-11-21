var assert = require('assert');
var Promise = require('promise');
var _ = require('underscore');

var niagara = require('./../index.js');

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
		}, Math.floor(Math.random() * 1000));
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

function sometimesAsync(value){
	return Math.random() > 0.5 ? value : Promise.resolve(value);
}

function syncError(value){
	if (value === 'zalgo'){
		throw new Error('Zalgo not allowed');
	} else {
		return value;
	}
}

var values = _.map(_.range(34), function(){ return 'some-value'; });
var wrappedValues = _.map(_.range(34), function(){ return ['zalgo']; });
var singleValue = ['lonesome'];

describe('niagara', function(){
	this.timeout(25000);
	it('maps a collection against an async function', function(){
		return niagara(values, delayValue).then(function(result){
			assert.deepEqual(result, values);
		});
	});
	it('keeps data integrity', function(){
		return niagara(wrappedValues, delayValue).then(function(result){
			assert.deepEqual(result, wrappedValues);
		});
	});
	it('handles collections of a single item properly', function(){
		return niagara(singleValue, delayValue).then(function(result){
			assert.deepEqual(result, singleValue);
		});
	});
	it('respects the default concurrency threshold of 8', function(){
		currentlyRunning = 0;
		maxRunning = 0;
		return niagara(values, delayValue).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(8, maxRunning);
		});
	});
	it('respects the given concurrency threshold, given 3', function(){
		currentlyRunning = 0;
		maxRunning = 0;
		var limit = 3;
		return niagara(values, delayValue, limit).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(limit, maxRunning);
		});
	});
	it('respects the given concurrency threshold, given 1', function(){
		currentlyRunning = 0;
		maxRunning = 0;
		var limit = 1;
		return niagara(values, delayValue, limit).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(limit, maxRunning);
		});
	});
	it('respects the given concurrency threshold, given a number too large', function(){
		currentlyRunning = 0;
		maxRunning = 0;
		var limit = 12;
		var values = ['a', 'b'];
		return niagara(values, delayValue, limit).then(function(result){
			assert.deepEqual(result, values);
			assert.equal(values.length, maxRunning);
		});
	});
	it('propagates rejections correctly', function(){
		var strings = ['foo', 'zalgo', 'bar', 'zalgo'];
		return niagara(strings, rejectZalgo).then(function(){
				assert(false);
			})
			.catch(function(err){
				assert(err);
				assert.equal(err.message, 'Zalgo not allowed');
			});
	});
	it('properly handles synchronous errors', function(){
		var strings = ['foo', 'bar', 'zalgo'];
		return niagara(strings, syncError).then(function(res){
				assert(false);
			})
			.catch(function(err){
				assert(err);
				assert.equal(err.message, 'Zalgo not allowed');
			});
	});
	it('can handle synchronous return values', function(){
		return niagara(values, identity, 8).then(function(result){
			assert.deepEqual(result, values);
		});
	});
	it('can handle synchronous and asynchronous return values', function(){
		return niagara(values, sometimesAsync, 8).then(function(result){
			assert.deepEqual(result, values);
		});
	});
});

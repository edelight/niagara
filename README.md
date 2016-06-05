# niagara
> asynchronous map and filter (while keeping a given concurrency limit)

[![Build Status](https://travis-ci.org/m90/niagara.svg?branch=master)](https://travis-ci.org/m90/niagara)

### Installation:

Install from npm:

```sh
$ npm install niagara --save
```

### Use case

 Throttle HTTP requests down to a level that your server can handle or gracefully digest computation heavy asynchronous operations.

### Examples:

```js
import Niagara from 'niagara';
import {getJSON} from 'jquery';

var maxRunning = 0;
var currentlyRunning = 0;

const callResource = (id) => {
    currentlyRunning++;
    maxRunning = Math.max(currentlyRunning, maxRunning)
    return getJSON(`https://my.api.com/resource/${id}`)
        .promise()
        .then((result) => {
            currentlyRunning--;
            return result;
        });
};

const resourceIds = ['1','2','3'/*....*/,'456'];

Niagara(resourceIds, { limit: 8 })
    .map(callResource)
    .then((result) => {
        // array containing the results of each call
        console.log(maxRunning); //=> will be 8
    })
    .catch((err) => {
        // error of the call that failed
        console.log(maxRunning); //=> will be 8
    });
```

```js
import Niagara from 'niagara';
import {getJSON} from 'jquery';

const callUnreliableResource = (id) => {
    return getJSON(`https://my.api.com/404-on-odd-numbers/${id}`).promise();
};

const resourceIds = ['1','2','3'/*....*/,'456'];

Niagara(resourceIds, { limit: 8 })
    .filter(callResource)
    .then((result) => {
        // array containing the results of each successful call
    });
```

### API:

#### Niagara(collection, options)

```js
var falls = Niagara([1,2,3,4], { limit: 4, Promise: require('bluebird') });
```

An instance can be constructed without using the `new` keyword. Possible `options` are `limit`, setting the concurrency limit for all transformations and `Promise` for the promise implementation to use. If no Promise implementation is passed the library will look for a globally available or native version.

#### Niagara.setPromise(promiseImplementation)

You can configure the module with a default value for the used Promise implementation. This will be used when no implementation was passed in the options.

```js
Niagara.setPromise(require('bluebird'));
var victoriaFalls = Niagara(list, { limit: 2 }); //uses bluebird
var iguazuFalls = Niagara(list, { limit: 2, Promise: require('promise') }); //uses promise.js
```

#### #map(transform [, thisArg])

```js
Niagara([1,3,2,4], { limit: 2 })
    .map((element, index, collection) => {
        // return Promise or plain value
    }, thisArg)
    .then((result) => console.log(result))
    .catch((err) => console.error(err));
```

#### #filter(predicate [, thisArg])

```js
Niagara([1,3,2,4], { limit: 2 })
    .filter((element, index, collection) => {
        // filter by rejecting the returned Promise
        // or throwing an Error
    }, thisArg)
    .then((result) => console.log(result));
```

### License
MIT © [Frederik Ring](http://www.frederikring.com)

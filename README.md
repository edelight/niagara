# niagara
> transform a collection against an async function (while keeping a given concurrency limit)

[![Build Status](https://travis-ci.org/m90/niagara.svg?branch=master)](https://travis-ci.org/m90/niagara)

### Installation:

Install from npm:

```sh
$ npm install niagara --save
```

### Use case

 Throttle HTTP requests down to a level that your server can handle or gracefully digest computation heavy asynchronous operations.


### Example:

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
        .then(() => currentlyRunning--);
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

### API:

#### Niagara(collection, options)

```js
var falls = Niagara([1,2,3,4], { limit: 4, Promise: require('bluebird') });
```

An instance can be constructed without using the `new` keyword. Possible `options` are `limit`, setting the concurrency limit for all transformations and `Promise` for the promise implementation to use. If no Promise implementation is passed the library will look for a globally available or native version.

#### #map(transform [, thisArg])

```js
Niagara([1,3,2,4], { limit: 2 })
    .map((element, index, collection) => { /* */ }, thisArg)
    .then((result) => console.log(result));
```

`#map` behaves exactly like `Array.prototype.map`

### License
MIT © [Frederik Ring](http://www.frederikring.com)

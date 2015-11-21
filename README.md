# niagara
> map a collection against an async function while keeping a given concurrency limit

[![Build Status](https://travis-ci.org/m90/niagara.svg?branch=master)](https://travis-ci.org/m90/niagara)

### Installation:

Install from npm:

```sh
$ npm install niagara --save
```

### Example:

```js
import niagara from 'niagara';
import {getJSON} from 'jquery';

const callResource = (id) => {
    return getJSON(`https://my.api.com/resource/${id}`).promise();
};

const resourceIds = ['1','2','3'/*....*/,'456'];

niagara(resourceIds, callResource)
    .then((result) => {
        // array containing the results of each call
    })
    .catch((err) => {
        // error of the call that failed
    });
```

### API:

Pass an Array and a function that transforms each value of that Array into a Promise or a synchronous value. If not given the limit for concurrent operations defaults to 8.

```js
niagara(collection, transformFn [, concurrencyLimit]);
```

### License
MIT © [Frederik Ring](http://www.frederikring.com)

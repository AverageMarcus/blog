---
layout: post.html
title:  "Getters and Setters in JavaScript"
date:   2018-01-27
tags: JavaScript
summary: "I was recently asked by [Ruth](https://twitter.com/rumyra) to explain what the purpose of getters and setters are in JavaScript and how to use them. This led to me somewhat ramble about all I know on the subject in the [JSOxford](https://jsoxford.com) channel of the [Digital Oxford Slack](http://slack.digitaloxford.com/). People seemed to find what I said useful so I thought it best to write a more coherent version."
---

I was recently asked by [Ruth](https://twitter.com/rumyra) to explain what the purpose of getters and setters are in JavaScript and how to use them. This led to me somewhat ramble about all I know on the subject in the [JSOxford](https://jsoxford.com) channel of the [Digital Oxford Slack](http://slack.digitaloxford.com/). People seemed to find what I said useful so I thought it best to write a more coherent version.

## What are they?

The simplest way I like to think about them is as a way to create dynamic values that look like normal properties to those using them. I think the best way to explain them is with an example.

```js
class Person {
  constructor(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

  get fullName() {
    return this.firstName + ' ' + this.lastName;
  }
}

const ruth = new Person('Ruth', 'John');
console.log(ruth.fullName); // "Ruth John"
```

Here we have a Person class that takes in a first and last name when instantiating and we have a getter that dynamically returns the full name when called. Notice we're not calling `fullName` as a function, it just looks like any other property to those interacting with the object.

As we only have a getter specified for `fullName` we can't set anything to it.

```js
console.log(ruth.fullName); // "Ruth John"
ruth.fullName = "Someone Else";
console.log(ruth.fullName); // Still "Ruth John"
```

Setters work in a very similar way. They take in a single value and do something with it.

```js
set fullName(val) {
  const names = val.split(' ');
  this.firstName = names[0];
  this.lastName = names[1];
}

...

ruth.fullName = "Someone Else";
console.log(ruth.firstName); // "Someone"
console.log(ruth.lastName); // "Else"
```

## But why?

So you might be looking at this and wondering "why not just use a function"?

There's a couple of reasons I think they are useful. First they give the consumer of the object a single way to interact with data, it doesn't need to know the different between static values and calculated values. The second reason is the ability to set a getter as being enumerable (more on this below) which would mean it would be included when doing things like `JSON.stringify` so you can have a string representation of a calculated value that you can then persist or send over the wire.

> Note: Using the `get` and `set` keywords are just syntactical sugar that provides some default properties. See below about how to have more control over the properties you define.

One very useful usecase for setters is when you have an existing object with a well used interface, let's say something that takes a width, and it's decided at a later date that some validation is wanted on this field. Rather than having to introduce a breaking change you can use a setter and implement the validation there, rather than having to have all clients update the way they interact with your object.


```js
class Shape {
  constructor() {
    this.width = 0;
  }
}

const box = new Shape();
box.width = 100; // OK
box.width = 'Cake'; // Also OK

// Now we want to add validation

class Shape {
  constructor() {
    this.width = 0;
  }

  set width(val) {
    if (typeof val !== 'number') {
      throw new Error('Must be a number');
    }
    this._width = val;
  }
}

const box = new Shape();
box.width = 100; // OK
box.width = 'Cake'; // Throws
```

> Note: I am using `this._width` here to indicate a "private" property. In reality JavaScript doesn't have this ability so is more just a convention.

## Having more control

You can get more control when using `Object.defineProperty` rather than the `get` or `set` keyword. This allows you to specify things like whether the property is enumerable or not (useful for `JSON.stringify` as mentioned above).

```js
class Person {
  constructor(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;

    Object.defineProperty(this, 'fullName', {
      enumerable: true,
      get: function() {
        return this.firstName + ' ' + this.lastName;
      }
    });
  }
}

const ruth = new Person('Ruth', 'John');
console.log(JSON.stringify(ruth)); // "{\"firstName\":\"Ruth\",\"lastName\":\"John\",\"fullName\":\"Ruth John\"}"
```

Note that `fullName` is now stringified thanks to it being marked as `enumerable`.

> One thing to be careful of here is if you have an object with an enumerable getter but no setter (as we have here) and you try and do `Object.assign(new Person, JSON.parse(stringifiedRuthObject))` you will get an error:
>
> TypeError: Cannot set property fullName of #\<Person\> which has only a getter

`Object.defineProperty` can do more than just getters and setters too. It also has the ability to create read only properties.

```js
class Person {
  constructor(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;

    Object.defineProperty(this, 'isAwesome', {
      value: true // note we don't specify `writable` which defaults to false
    });
  }
}

const ruth = new Person('Ruth', 'John');
console.log(ruth.isAwesome); // true
ruth.isAwesome = false;
console.log(ruth.isAwesome); // Still true!
```

## Can I use it?

Throughout this post I've only used classes to demonstrate the usage of getters and setters but it's not needed, you can use `Object.defineProperty` on normal objects too and is supported all the way back to **IE9**.

```
function Person(firstName, lastName) {
  this.firstName = firstName;
  this.lastName = lastName;

  Object.defineProperty(this, 'fullName', {
    get: function() {
      return this.firstName + ' ' + this.lastName;
    }
  });
}

var ruth = new Person('Ruth', 'John');
console.log(ruth.fullName); // "Ruth John"
```

## Related

It's also been possible to do similar in other ways. The now deprecated `Object.observe` could do similar to an instantiated object and the more recent introduction of `Proxy` that allows you to wrap an instantiated object and intercept actions performed on it. But those are best left for another day.

It's worth checkout out the MDN documentation for [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) to see all the configuration available.


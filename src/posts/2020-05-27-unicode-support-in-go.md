---
layout: post.html
title: "Unicode Support in Go"
date: 2020-05-27
tags: golang
summary: "With Go being a relatively modern programming language, first released in 2009, it is not unsurprising that it has great support for Unicode strings. What is surprising is just how far this support goes."
---
_Updated 2020-05-28: Added big list of naughty strings test_


With Go being a relatively modern programming language, first released in 2009, it is not unsurprising that it has great support for Unicode strings. What is surprising is just how far this support goes.

While recently working with the [Gomega](https://onsi.github.io/gomega/) assertion library I was going through the [docs](https://pkg.go.dev/github.com/onsi/gomega) and spotted this very interesting function: [`Ω`](https://pkg.go.dev/github.com/onsi/gomega?tab=doc#%ce%a9)

The `Ω` function is identical to the `Expect` function and just seems to be for novelty / stylistic reasons but it got me thinking about how Go supports this as a function name.

Lets take a look at the [language specification](https://golang.org/ref/spec) for Go. This document outlines everything that is allowed within the Go programming language. The section we're interested in is with regards to [characters](https://golang.org/ref/spec#Characters). This section contains this paragraph of note with regards to unicode support:
> In The Unicode Standard 8.0, Section 4.5 "General Category" defines a set of character categories. Go treats all characters in any of the Letter categories Lu, Ll, Lt, Lm, or Lo as Unicode letters, and those in the Number category Nd as Unicode digits.

The categories listed cover all letters and numbers in all languages currently found (as of version 8.0) in Unicode. This does not include punctuation or special characters.

_(Note: The Unicode characters used below may not all display correctly depending on the operating system and web browser you are using)_

For example, the following is perfectly valid Go code:

```go

package main

import "fmt"

func main() {
  // Here we're using the Greek word `μεταβλητός` meaning "variable" according to Google translate.
  μεταβλητός := "Hello, world!"
  fmt.Println(μεταβλητός)

  // And here the Russian translation
  переменная := "Hello, world!"
  fmt.Println(переменная)
}
```

It's even possible to use Egyptian Hieroglyphs and Cuneiform:

```go
package main

import "fmt"

func main() {
  𓀵 := "Hello, world!"
  fmt.Println(𓀵)
  𒀗 := "Hello, world!"
  fmt.Println(𒀗)
}
```

I can imagine this makes Go a very attractive language for non-English speakers as they can write their variables and functions in their native language. But as an English speaker I can see other potential (novel) uses for this.

As many Unicode characters resemble existing English characters or familiar symbols we can make use of this in the same was as Gomega to have a bit more fun with our code.

Similar tricks are often used on Twitter to make tweets stand out more. Plenty of [websites](https://lingojam.com/TwitterFonts) have cropped up that will create stylised versions of your text. Using such websites we can create some interesting variable names.

```go
package main

import "fmt"

func main() {
  𝓋𝒶𝓇𝒾𝒶𝒷𝓁𝑒 := "Hello, world!"
  fmt.Println(𝓋𝒶𝓇𝒾𝒶𝒷𝓁𝑒)

  𝔳𝔞𝔯𝔦𝔞𝔟𝔩𝔢 := "Hello, world!"
  fmt.Println(𝔳𝔞𝔯𝔦𝔞𝔟𝔩𝔢)

  𝕧𝕒𝕣𝕚𝕒𝕓𝕝𝕖 := "Hello, world!"
  fmt.Println(𝕧𝕒𝕣𝕚𝕒𝕓𝕝𝕖)
}
```

Just like Gomega we can make some interesting variable and function names by making use of the more picture-like characters available to us.
For example the Latin letter Retroflex Click looks just like an exclamation mark, `ǃ`, and could be used for things like holding a default error message:

```go
ǃ := "Something went wrong"
fmt.Errorf(ǃ)
```

The Tagbanwa letter Ka looks very similar to a cross and could be used to hold the `false` boolean for use later as a pointer.

```go
ᝣ := false
pointerFalse := &ᝣ
```

## Not just Go

When I first came across this I had thought this was fairly unique to Go as I had never come across similar before in any of the other languages I've worked with. After some experimentation it turns out this is much, much more common that I realised.

For example, here is one of the earlier examples re-wrote for NodeJS:

```js
// Tested and confirmed working with Node v12
𝓋𝒶𝓇𝒾𝒶𝒷𝓁𝑒 = "Hello, world!"
console.log(𝓋𝒶𝓇𝒾𝒶𝒷𝓁𝑒)

𝔳𝔞𝔯𝔦𝔞𝔟𝔩𝔢 = "Hello, world!"
console.log(𝔳𝔞𝔯𝔦𝔞𝔟𝔩𝔢)

𝕧𝕒𝕣𝕚𝕒𝕓𝕝𝕖 = "Hello, world!"
console.log(𝕧𝕒𝕣𝕚𝕒𝕓𝕝𝕖)
```

And the same again in Python:

```python
# Tested and confirmed working with Python 3.8.2
𝓋𝒶𝓇𝒾𝒶𝒷𝓁𝑒 = "Hello, world!"
print(𝓋𝒶𝓇𝒾𝒶𝒷𝓁𝑒)

𝔳𝔞𝔯𝔦𝔞𝔟𝔩𝔢 = "Hello, world!"
print(𝔳𝔞𝔯𝔦𝔞𝔟𝔩𝔢)

𝕧𝕒𝕣𝕚𝕒𝕓𝕝𝕖 = "Hello, world!"
print(𝕧𝕒𝕣𝕚𝕒𝕓𝕝𝕖)
```

## In the wild

I've tried to find other examples of these non-Latin Unicode characters being used in real code but have so far come up empty other than Gomega. I had assumed there'd be examples of code written in Russian or Chinese that made use of this but I can't seem to find any. Perhaps having a mix of native language variables and functions mixed with the English build in library functions isn't such a desireable outcome.


## Update

After posting this it was suggested to me to try the [big list of naughty strings](https://github.com/minimaxir/big-list-of-naughty-strings) to see how many of them Go can handle. This list is a collection of strings that often cause problems for programs in one way or another.

I put together a test case that used each string as a variable and then tested if the code could build. To ensure as many strings from the list could be attempted I removed all spaces from the strings.

The results were a bit surprising...

> 72 of the 506 strings are valid variable names in Go

(Note: This number may be higher than it should be due to removing spaces from strings)

Of those 72 valid strings there are some that we'd expect similar to what we covered above:

* `ﷺ`
* `𝕿𝖍𝖊𝖖𝖚𝖎𝖈𝖐𝖇𝖗𝖔𝖜𝖓𝖋𝖔𝖝𝖏𝖚𝖒𝖕𝖘𝖔𝖛𝖊𝖗𝖙𝖍𝖊𝖑𝖆𝖟𝖞𝖉𝖔𝖌`
* `田中さんにあげて下さい`

But there are a few that are really surprising:

* `nil`
* `true`
* `false`


So, it turns out this is a perfectly valid Go program:

```go
package main

import "fmt"

func main() {
	nil := "Not a value"
	false := 55

	if !true() {
		fmt.Println(false)
	}
	
	fmt.Println(nil)
}

func true() bool {
	return false
}
```

When run this outputs:

```
55
Not a value
```

Please, please, never do this in your code.

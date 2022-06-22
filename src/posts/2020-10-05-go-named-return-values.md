---
layout: post.html
title: "T.I.L. Named returns in Go functions"
summary: "Today I Learnt: Named returns in Go functions"
date: 2020-10-05T15:50:00
tags: til golang

---

While debugging some issues I was having with the AWS Golang SDK I discovered it was possible to name your function return values (pointers) and then set them within your function body without needing to explicitly return them at the end.

E.g.

```go
package main

import "fmt"

var greeting = "Hello, world"

func main() {
	fmt.Println(*test())
}

func test() (returnVal *string) {
	returnVal = &greeting
	return
}
```

Note the single `return` at the end of the function.

I'm not really sure if this is a useful feature, feels more like it'd make code harder to read and could lead to some pretty nasty unintended mistakes when someone unfamilure with the code comes to make changes. Interesting either way.

I'd be interested if anyone has any examples of where this kind of thing is beneficial.

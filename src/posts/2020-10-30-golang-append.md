---
layout: post.html
title: "T.I.L. Golang's append mutates the provided array"
summary: "Today I Learnt: Golang's append mutates the provided array"
date: 2020-10-30T12:49:37+01:00
tags: til golang

---

A word of warning when using `append()` in Golang...

When using a slice of an array as the first parameter when calling `append` if the length of the resulting array is less than that of the initial array then the values in the initial array will be overridden by the new values being appended.

For example, if we use `append` to take the first two values from the array called `first` and all the values from the array called `second` we can see that `first` is being mutated unexpectedly.

```go
package main

import "fmt"

func main() {
  first := []int{0, 1, 2, 3, 4, 5, 6}
  second := []int{4, 5, 6}

  fmt.Println(first)
  // -> [0 1 2 3 4 5 6]
  fmt.Println(append(first[:2], second...))
  // -> [0 1 4 5 6]
  fmt.Println(first)
  // -> [0 1 4 5 6 4 5 6]
}
```

This is _only_ an issue when the resulting array is shorter than the array passed in as the first parameter.

**Update:**
It turns out this is expected behavior (see [github.com/golang/go/issues/28780#issuecomment-438428780](https://github.com/golang/go/issues/28780#issuecomment-438428780)) and a side-effect of how slices work in Go.

A slice (what we're producing when using the `[:2]`) can be thought of as a view onto an array. So when making changes to a slice you're really just making changes to that part of the array it is pointed to. By default slices are dynamic in size so if you go past the end of the slice you still continue along the array if it has more entries.

To avoid this happening you can specify a third value in the slice that sets the fixed length of the slice. E.g.

```go
package main

import "fmt"

func main() {
  first := []int{0, 1, 2, 3, 4, 5, 6}
  second := []int{4, 5, 6}

  fmt.Println(first)
  // -> [0 1 2 3 4 5 6]
  fmt.Println(append(first[:2:2], second...))
  // -> [0 1 4 5 6]
  fmt.Println(first)
  // -> [0 1 2 3 4 5 6]
  fmt.Println("Much better :)")
}
```

---
layout: post.html
title: "T.I.L. Split on spaces in Go"
summary: "Today I Learnt: Split on spaces in Go"
date: 2020-09-18
tags: til go golang

---

While looking to split a multiline and space separated string and not having any luck with `strings.Split()` I came across this somewhat oddly names function:

```go
import (
    "fmt"
    "strings"
)

func main() {
    input := `This is
a multiline, space
separated string`

    output := strings.Fields(input)

    fmt.Println(output) // ["This", "is", "a", "multiline,", "space", "separated", "string"]
}
```

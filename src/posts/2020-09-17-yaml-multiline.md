---
layout: post.html
title: "T.I.L. YAML multiline values"
summary: "Today I Learnt: YAML multiline values"
date: 2020-09-17
tags: til yaml

---

After using YAML for a long time, for many, many Kubernetes manifest files, I have today learnt that it contains two multiline value types (called scalars):

```yaml
scalarsExample:
    literalScalar: |
        Literal scalars use the pipe (`|`) to denote the start of the value with the scope indicated by indentation.
        All content here is used literally, with newlines preserved.
        <-- This is the start of the line, the spaces before this aren't included in the literal.
        This should be used when storing things like file contents (e.g. in a ConfigMap)
    foldedScalar: >
        Folded scalars use the greater-than symbol (`>`) to denote the start of the value with the scope indicated by indentation.
        Unlike literal scalars newlines aren't preserved and instead converted into spaces.
        <-- This is the start of the line, the spaces before this aren't included in the value.
        This should be used when you'd normally use a string but the contents are long and wrapping makes it easier to read.
```

> More info: [https://yaml.org/spec/1.2/spec.html#id2760844](https://yaml.org/spec/1.2/spec.html#id2760844)

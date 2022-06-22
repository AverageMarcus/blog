---
layout: post.html
title: "T.I.L. YAML keys allow for spaces in them"
summary: "Today I Learnt: YAML keys allow for spaces in them"
date: 2021-05-11
tags: til yaml

---

While browsing through some of [Frenck's](https://github.com/frenck) [Home Assistant Config](https://github.com/frenck/home-assistant-config) for ideas I came across [this interesting line of YAML](https://github.com/frenck/home-assistant-config/blob/a963e1cb3e2acf7beda2b466b334218ac27ee42f/config/integrations/automation.yaml#L7):

```yaml
---
# This handles the loading of my automations
#
# https://www.home-assistant.io/docs/automation/
#
automation: !include ../automations.yaml
automation split: !include_dir_list ../automations    # <--
```

I found myself staring at this for a while, followed by searching the [Home Assistant](https://www.home-assistant.io/) documentation website to see if `split` was a special keyword I wasn't aware of.

And then it dawned on me! As all JSON is valid YAML, and JSON keys can be pretty much any string it makes sense that YAML supports it.

The above example converted to JSON using [json2yaml](https://www.json2yaml.com/convert-yaml-to-json) looks like this:

```json
{
  "automation": "../automations.yaml",
  "automation split": "../automations"
}
```

Knowing this, I decided to try out a few more variations to see what works...

YAML:
```yaml
---
123: Valid
---: also valid
5.5: yup! this too
#how about this?: nope, this is treated as a comment
//: yeah, totally valid
✨: yep!
[1]: Works
[1, 2]: Still works, treated as string
{another}: This one is interesting
```

JSON:
```json
{
  "123": "Valid",
  "---": "also valid",
  "5.5": "yup! this too",
  "//": "yeah, totally valid",
  "✨": "yep!",
  "[1]": "Works",
  "[1, 2]": "Still works, treated as string",
  "{\"another\"=>nil}": "This one is interesting"
}
```

Depending on the library used, varying results can be generated. For example, [yamlonline](https://yamlonline.com/) returns the following for the same input:

```json
{
	"1": "Works",
	"123": "Valid",
	"---": "also valid",
	"5.5": "yup! this too",
	"//": "yeah, totally valid",
	"✨": "yep!",
	"1,2": "Still works, treated as string",
	"[object Object]": "This one is interesting"
}
```

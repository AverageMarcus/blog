---
layout: post.html
title: "T.I.L. Don't Reuse API Keys"
summary: "Today I Learnt: Don't Reuse API Keys"
date: 2020-10-03T12:49:37+01:00
tags: til cli credentials

---

Not a technical post today, more of a reminder to myself not to reuse API keys for different purposes. In this instance I reset the credentials I had labelled "Terraform" which I just so happened to also be using In [Harbor](https://goharbor.io/) to connect to my S3 bucket.

Que 2 hours of me trying to figure out why I couldn't pull or push any images.

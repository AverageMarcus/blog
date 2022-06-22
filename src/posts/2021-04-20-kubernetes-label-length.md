---
layout: post.html
title: "T.I.L. Kubernetes label length"
summary: "Today I Learnt: Kubernetes label length"
date: 2021-04-20T15:10:37+01:00
tags: til kubernetes

---

It turns out that label _values_ in Kubernetes have a limit of 63 characters!

I discovered this today when none of my nodes seemed to be connecting to the control plane. Eventually discovered the hostname of the node was longer than 63 characters (mainly due to multiple subdomain levels) and so the `kubernetes.io/hostname` label being automtically added to the node was causing Kubernetes to reject it.

If you hit this like me, the hostname used for the label can be [overridden using the `--hostname-override` flag on kubelet](https://kubernetes.io/docs/reference/labels-annotations-taints/#kubernetesiohostname) or by setting the value of the label yourself with the `--node-labels` flag.

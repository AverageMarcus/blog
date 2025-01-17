---
layout: post.html
date:  2025-01-14
title: Announcing Cloud Native Now
tags: CloudNative Announcement CloudNativeNow Newsletter
summary: |
  Last week I [announced](https://bsky.app/profile/did:plc:mtepw4cvbmdvu7zygmm5xbop/post/3lf5iccpxj22u) the launch of a new project I've been working on - [Cloud Native Now](https://cloudnative.now/) - a new monthly newsletter that will provide a roundup of all the happenings in the cloud native world. This newsletter is my attempt at keeping myself, and others, up-to-date on all the latest news, tools and events happening in the cloud native world. A new issue will be published each month on the last Friday of that month and contain a roundup of articles, announcements, tools, tutorials, events and CFPs relating to cloud native technologies and the community.

---

<details>
<summary>Changelog</summary>

2025-01-17: Added details about Cloudflare

</details>

Last week I [announced](https://bsky.app/profile/did:plc:mtepw4cvbmdvu7zygmm5xbop/post/3lf5iccpxj22u) the launch of a new project I've been working on - ✨ [Cloud Native Now](https://cloudnative.now/) ✨ - a new monthly newsletter that will provide a roundup of all the happenings in the cloud native world. This newsletter is my attempt at keeping myself, and others, up-to-date on all the latest news, tools and events happening in the cloud native world. A new issue will be published each month on the last Friday of that month and contain a roundup of articles, announcements, tools, tutorials, events and CFPs relating to cloud native technologies and the community.

<figure class="center" markdown="1">

![The Cloud Native Now logo](/images/Cloud_Native_Now_-_Square.jpg)

</figure>

I hope y'all will [subscribe to the email newsletter](https://cloudnative.now/about/#/portal/signup) or add the [RSS feed](https://cloudnative.now/rss/) to your favourite feed reader to make sure you don’t miss anything! Or, if you prefer, you'll be able to view the entire [archive](https://cloudnative.now/archive/) directly on the website.

There is also a [Bluesky](https://bsky.app/profile/cloudnative.now?ref=cloudnative.now) and [Mastodon](https://k8s.social/@CloudNativeNow?ref=cloudnative.now) account if you prefer to follow those. If you have any suggestions for items to include or any improvements / changes that you think would be good then please do reach out. I'd love to hear from you!

## Technical Details

Now, I'm sure y'all are interested in all those tasty technical details!

### Infrastructure

There's nothing too wild going on, the majority of things are running on a [Civo](https://www.civo.com/) Kubernetes cluster along with a MySQL database and object store. The [infrastructure](https://github.com/NamelessPlanet/CloudNativeNow-Gitops/tree/main/infra) is managed using [OpenTofu](https://opentofu.org/) and applied by a [GitHub action](https://github.com/NamelessPlanet/CloudNativeNow-Gitops/blob/main/.github/workflows/opentofu.yaml) when changes are merged into the main branch.

OpenTofu also [handles](https://github.com/NamelessPlanet/CloudNativeNow-Gitops/blob/611eb9c2350bca125e1200f77f2fdd4977cf5386/infra/main.tf#L164-L167) installing [Flux](https://fluxcd.io/) into the cluster which points back to the same repo and handles managing Kubernetes resources via GitOps. The setup is mostly the same as outlined in my previous post - [Bootstrapping a Civo cluster with OpenTofu and Flux](https://marcusnoble.co.uk/2025-01-03-bootstrapping-a-civo-cluster-with-opentofu-and-flux/). Along with installing Flux into the cluster, OpenTofu also creates a few [Kubernetes Secrets](https://github.com/NamelessPlanet/CloudNativeNow-Gitops/blob/611eb9c2350bca125e1200f77f2fdd4977cf5386/infra/main.tf#L169-L213) containing various credentials that will be needed by applications (Civo creds for cluster-autoscaler, database credentials, object store credentials).

Flux is then setup to handle some [core applications](https://github.com/NamelessPlanet/CloudNativeNow-Gitops/blob/611eb9c2350bca125e1200f77f2fdd4977cf5386/flux/kube-system/kustomization.yaml) (sealed-secrets, metrics server, etc.) and then applies some extra Kustomizations that handles installing [apps](https://github.com/NamelessPlanet/CloudNativeNow-Gitops/tree/611eb9c2350bca125e1200f77f2fdd4977cf5386/apps) and [extra-config](https://github.com/NamelessPlanet/CloudNativeNow-Gitops/tree/611eb9c2350bca125e1200f77f2fdd4977cf5386/extra-config) (these are things that require apps to be installed first so have a dependency).

### Applications

There's not many applications that make up Cloud Native Now, the main is a self-hosted [Ghost](https://ghost.org/) powered site that handles the website, newsletter and RSS feed. This provides a very nice content management system for creating posts with very little effort. For the actual _sending_ of the newsletter, [Mailgun](https://www.mailgun.com/) is the service of choice here. The posts and content for Ghost is all stored in a Civo-managed MySQL database and object store. For the theme, I forked the [Alto](https://github.com/TryGhost/Alto) theme and applied some custom tweaks in my [own repo](https://github.com/NamelessPlanet/CloudNativeNow-Theme).

Within the cluster there is also [ingress-nginx](https://github.com/kubernetes/ingress-nginx/) (for ingress), [cluster-autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler) (for dynamic worker node sizing) and [cert-manager](https://github.com/cert-manager/cert-manager) (for SSL certificates).

Backups are very basic right now - a couple [CronJobs](https://github.com/NamelessPlanet/CloudNativeNow-Gitops/blob/main/apps/ghost-backup.yaml) that run regularly to perform a MySQL dump and a copy of the object store content into another backup object store (with some versioning in place).

To handle the collation of entries for the newsletter throughout the month I've put together a custom [Grist](https://www.getgrist.com/) project that I use to record links and data as I find them. Unfortunately, this isn't public and I don't have anything to share. To make this easier to work with I built a custom [url-to-grist](https://github.com/NamelessPlanet/url-to-grist) tool that allows me to share an URL to it and it'll automatically import it into Grist and attempt to grab some metadata about the page to help with putting together the newsletter.

I'm also re-using my existing [Node-RED](https://nodered.org/) setup to have new posts (based on the RSS feed) automatically posted to both the Mastodon and Bluesky accounts. Again, this is unfortunately not public but would be happy to chat about it if anyone is interested.

One area that still needs improvement is monitoring. Currently there is some [blackbox](https://github.com/prometheus/blackbox_exporter) monitoring from my local infrastructure to ensure pages are reachable and I have some (temporary) [MySQL monitoring](https://github.com/prometheus/mysqld_exporter) to keep an eye on the state of the database. This is an area I'll be focussing more on over the next few months to ensure uptime is maintained as much as possible.

### Issues along the way

It hasn't been all smooth sailing so far. I had some trial-and-error with OpenTofu and getting the infra set up how I wanted. This was _mostly_ due to me having not worked with it for a long time and just bumbling through it.

One major issue I have experienced a few times other the past week or so is [database connectivity problems](https://bsky.app/profile/cloudnative.now/post/3lfcv22dm722t). It's still unclear exactly what happened and I've been working with Civo support to try and figure this out but it looks like somehow the database was being overwhelmed. I've now got monitoring in place to try and catch this happening again but as of now it hasn't yet occurred again.

It looks like I had also misconfigured the email sending at some point between launching and publishing this blog post. 😅 This is now fixed and sign ups should be working again now.

### The Future

There's several things I already have planned as well as some vague ideas for things I might do, depending on how popular this ends up becoming.

Besides improving the monitoring as mentioned above ~~I plan to also implement [Cloudflare](https://www.cloudflare.com/) as a cache in front of the website to ensure the database doesn't get overloaded too much~~ (see below).

Eventually, after a couple issues or so to get a feel for what people want, I'm hoping to also set up an accompanying Podcast where I talk with a different guest each month about all the happenings in that months newsletter. I want to use this as a way to talk with all the ✨ wonderful ✨ humans in our cloud native community and get a wide and diverse array of thoughts and opinions to complement (and maybe contrast) with my own. I'm really hoping to not have this just become "another white guy with a podcast" but something that can really show the amazing individuals and efforts without our community.

If things go well and this ends up taking off, I have some loose plans on how to cover the costs as things grow. I guarantee that all newsletter editions will always be freely available without an account but I'm hoping to later introduce paid membership that comes with some extra goodies. Not sure what _exactly_ yet but I'm thinking along the lines of being able to add comments to the posts, the warm good feeling of helping keeping things running and _maybe_ some physical rewards (postcards, stickers, etc.) if I can figure out how to send to the EU. 😅 There's also a possibility to sponsored posts and job listings in the future but I need to come up with some requirements that these would need to meet first to ensure quality.

And who knows... maybe I'll go wild and look at putting together a [conference](https://bsky.app/profile/salisburyheavyindustries.com/post/3lf5j56yo5k2w) that I've always wanted too!

### Updates

I have now switched to using [Cloudflare](https://www.cloudflare.com/) for the nameserver and proxying requests through their edge servers with a 2 hour cache added to most of the site. This should allow the site to remain up, and read-only, during any periods where the database (or other) is having trouble. I did have a small issue when setting this up that resulted in infinite redirects - turns out I needed to switch from "Flexible" to "Full" in the Cloudflare SSL configuration, otherwise nginx kept trying to perform a redirect to the SSL port as Cloudflare was sending traffic to port 80.

For those interested, this is the specific expression I'm using for the caching in Cloudflare with an Edge TTL of 2 hours:

```
(http.request.full_uri wildcard "https://cloudnative.now/*" and not starts_with(http.request.uri.path, "/ghost/"))
or
(http.request.full_uri wildcard "https://www.cloudnative.now/*" and not starts_with(http.request.uri.path, "/ghost/"))
```

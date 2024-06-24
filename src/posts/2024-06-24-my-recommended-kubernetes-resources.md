---
layout: post.html
date:  2024-06-24
title: My Recommended Kubernetes Resources for Newbies
tags: Kubernetes K8s
summary: |
  Recently, a friend of mine asked me what resources I'd recommend to start learning about Kubernetes. He was a victim of the layoffs that seem to be so prevalent right now and has experience as a classic SysOps / SysAdmin engineer but no expose to Kubernetes yet and wanted to learn to help improve his job-hunting prospects.

  I wasn't sure what to recommend at first, it's been a long time since I was learning Kubernetes for the first time and wasn't sure what was still useful and relevant but what follows is what I ended up sharing with him, and now with all of you.

---

<details>
<summary>Changelog</summary>

2024-06-24: Added links to video channels DevOpsToolkit, You Choose and Enlightning. Added link to KubeHuddle conference.

</details>

Recently, a friend of mine asked me what resources I'd recommend to start learning about Kubernetes. He was a victim of the layoffs that seem to be so prevalent right now and has experience as a classic SysOps / SysAdmin engineer but no expose to Kubernetes yet and wanted to learn to help improve his job-hunting prospects.

I wasn't sure what to recommend at first, it's been a long time since I was learning Kubernetes for the first time and wasn't sure what was still useful and relevant but what follows is what I ended up sharing with him, and now with all of you.

> If you have suggestions for more resources to include here please reach out to me on Mastodon at [@Marcus@k8s.social](https://k8s.social/@Marcus)!

(I have also previously wrote about [my recommended Go resources](/2021-09-02-my-recommended-go-resources/) which also might be of interest.)

## 📚 Books

* [The Kubernetes Book](https://www.amazon.com/Kubernetes-Book-Version-November-2018-ebook/dp/B072TS9ZQZ) by Nigel Poulton
* [Docker Deep Dive](https://www.amazon.com/Docker-Deep-Dive-Nigel-Poulton-ebook/dp/B01LXWQUFF/) by Nigel Poulton (if you also need to get up to speed with Docker / Containers)
* [Quick Start Kubernetes](https://www.amazon.com/Quick-Start-Kubernetes-Nigel-Poulton-ebook/dp/B08T21NW4Z) by Nigel Poulton
* [Understanding Kubernetes in a visual way](https://www.amazon.com/Understanding-Kubernetes-visual-way-sketchnotes/dp/B0BB619188) by Aurélie Vache
* [The Illustrated Children’s Guide to Kubernetes](https://www.cncf.io/phippy/the-childrens-illustrated-guide-to-kubernetes/) - don't let its child-focussed format fool you, this is a great (free) book! And theres a whole [series of books](https://www.cncf.io/phippy/) on related topics available.

The following might not be quite beginner friendly and should be picked up after you understand the basics:

* [Kubernetes Best Practices](https://www.amazon.co.uk/Kubernetes-Best-Practices-Blueprints-Applications/dp/1098142160) by Brendan Burns, Eddie Villalba, Dave Strebel & Lachlan Evenson
* [Kubernetes Patterns](https://www.amazon.co.uk/Kubernetes-Patterns-Reusable-Designing-Applications/dp/1492050288/) by by Bilgin Ibryam, Roland Huβ Ph.d.

## 🧰 Services, Tools and Libraries

* [Civo](https://www.civo.com/) - you can get $250 worth of credit when you sign up to play with their managed Kubernetes offerings.
* [Kind](https://kind.sigs.k8s.io/) - local testing / experimenting with Kubernetes running inside a container.
* [Talos](https://www.talos.dev/) - My favourite OS for running Kubernetes on. This is what powers my homelab cluster.
* [k3s](https://k3s.io/) - a great, lightweight Kubernetes distrobution that you can even run on a Raspberry Pi!
* [k9s](https://github.com/derailed/k9s/) - an interactive terminal tool for working with a Kubernetes cluster

## 🔗 Websites / Blog Posts / Tutorials

* [Official Kubernetes tutorials](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
* [Civo Learn](https://www.civo.com/learn) - Tutorials
* [Civo Academy](https://www.civo.com/academy) - A series of workshops to help beginners learn Kubernetes
* [Kube Academy](https://kube.academy/) from VMWare has a lot of tutorials to follow
* [Pluralsight](https://www.pluralsight.com) - if you have a subscription there's several good classes on here related to Kubernetes. I can recommend the ones by [Nigel Poulton](https://nigelpoulton.com/).
* I've previously written a blog post, [Managing Kubernetes without losing your cool](/2022-07-04-managing-kubernetes-without-losing-your-cool/), that has some tools and tips I recommend for everyone working with Kubernetes.

## 📺 Videos

* [Rawkode Academy](https://www.youtube.com/@RawkodeAcademy) - David covers more than just Kubernetes and has a lot of useful videos about all things cloud native (and more)!
* [Kunal Kushwaha](https://www.youtube.com/@KunalKushwaha) - Kunal is a powerhouse when it comes to making super helpful videos. There a lot of stuff here, not just Kubernetes.
* [Anaïs Urlichs](https://www.youtube.com/@AnaisUrlichs) - Lots of great, beginner friendly video about Kubernetes and related tools. Specifically the [Full Kubernetes tutorial on Docker, KinD, kubectl, Helm, Prometheus, Grafana](https://www.youtube.com/watch?v=SeQevrW176A) which might be helpful.
* [CNCF](https://www.youtube.com/@cncf/playlists) - Collections of conference talks from previous KubeCon, Kubernetes Community Days and other conferences.
* [DevOpsToolkit](https://www.youtube.com/@DevOpsToolkit) - Viktor is great at introducing complex topics in an approachable way
* [You Choose](https://www.youtube.com/playlist?list=PLyicRj904Z9-FzCPvGpVHgRQVYJpVmx3Z) - a series of videos going through lots of the CNCF Landscape tools and pitting them against each other.
* [Enlightning](https://tanzu.vmware.com/content/enlightning) - Whitney does a great job of going through lots of CNCF technologies with the help of her lightboard.

## 📽️ Confernces

* KubeCon + CloudnativeCon is great for meeting people in the community if you have a chance to attend. There are events available in [North America](https://events.linuxfoundation.org/kubecon-cloudnativecon-north-america/), [Europe](https://events.linuxfoundation.org/kubecon-cloudnativecon-europe-2025/), [China](https://events.linuxfoundation.org/kubecon-cloudnativecon-open-source-summit-ai-dev-china/) and [India](https://events.linuxfoundation.org/kubecon-cloudnativecon-india/)
* I'm a huge fan of [Kubernetes Community Days](https://www.cncf.io/kcds/)! These are smaller, local Kubernetes conferences hosted all over the world.
* [Cloud Native Rejekts](https://cloud-native.rejekts.io/) is recent favourite of mine and is set up as the "b-side" conference to KubeCon. This great, community focussed conference runs for 2 days before the main KubeCon conference.
* [KubeHuddle](https://kubehuddle.com/) - a wonderful community focussed conference

## 📰 Newsletters

* [KubeWeekly](https://www.cncf.io/kubeweekly/) from CNCF

---

Hopefully these are helpful for someone! I'd love to hear what your favourite resources are, let me know on Mastodon at [@Marcus@k8s.social](https://k8s.social/@Marcus)!

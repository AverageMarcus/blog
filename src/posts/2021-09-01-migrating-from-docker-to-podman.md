---
layout: post.html
title:  "Migrating from Docker to Podman"
date:   2021-09-01
tags: Docker Containers
summary: "Docker has [recently announced](https://www.docker.com/blog/updating-product-subscriptions/) that Docker Desktop will soon require a subscription and, based on the size of your company, may require a paid subscription. (It remains free for personal use).

There has been quite a bit of reaction to this news..."
---

Docker has [recently announced](https://www.docker.com/blog/updating-product-subscriptions/) that Docker Desktop will soon require a subscription and, based on the size of your company, may require a paid subscription. (It remains free for personal use)

There has been quite a bit of reaction to this news:


<figure class="center" markdown="1">

[![](https://tweet.cluster.fun/1432720164169076755)](https://twitter.com/QuinnyPig/status/1432720164169076755)

<figcaption>Corey isn't too impressed with the news</figcaption>
</figure>


<figure class="center" markdown="1">

[![](https://tweet.cluster.fun/1432974196632604676)](https://twitter.com/manuel_zapf/status/1432974196632604676)

<figcaption>Manuel makes a good point about paying for what we rely on</figcaption>
</figure>

Depending on which side your opinions lie, you might be looking for alternatives. Well it just so happens that [Podman](https://podman.io) posted this well-timed tweet:


<figure class="center" markdown="1">

[![](https://tweet.cluster.fun/1432800271873323010)](https://twitter.com/Podman_io/status/1432800271873323010)

<figcaption>Well timed announcement</figcaption>
</figure>

So, lets give it a whirl...

## Replacing Docker with Podman (on Mac)

1. `brew install podman`
2. Wait while brew downloads, builds and installs...
3. Create a virtual machine for Podman to run from:

    ```sh
    ✨ podman machine init

    Downloading VM image: fedora-coreos-34.20210821.1.1-qemu.x86_64.qcow2.xz: done
    Extracting compressed file

    🕙 took 2m44s
    ```

4. Start the virtual machine and set up the connection to Podman:

    ```sh
    ✨ podman machine start

    INFO[0000] waiting for clients...
    INFO[0000] listening tcp://0.0.0.0:7777
    INFO[0000] new connection from  to /var/folders/x_/bfc7v6kn4fs0rl9k77whs0nw0000gn/T/podman/qemu_podman-machine-default.sock
    Waiting for VM ...
    qemu-system-x86_64: warning: host doesn't support requested feature: CPUID.80000001H:ECX.svm [bit 2]

    🕙 took 34s
    ```

5. `alias docker=podman` (Add this to your `.bashrc` (if using Bash), `.zshrc` (if using ZSH) or whatever the correct file for your shell is)
6. 🎉

## Troubleshooting

Ok, so it's not all *completely* pain free, there are a few issues you might hit...

```sh
Error: failed to parse query parameter 'X-Registry-Config': "n/a": error storing credentials in temporary auth file (server: "https://index.docker.io/v1/", user: ""): key https://index.docker.io/v1/ contains http[s]:// prefix
```

Podman seems more strict than Docker when parsing the config file, check the `~/.docker/config.json` file for the key with the `https://` prefix (as mentioned in the error message) and remove it.

```sh
✨ podman machine start
ERRO[0000] "/var/folders/x_/bfc7v6kn4fs0rl9k77whs0nw0000gn/T/podman/qemu_podman-machine-default.sock" already exists
panic: interface conversion: net.Conn is nil, not *net.UnixConn
```

This seems to happen (for me at least) when I've previously run `podman machine stop`. It looks like the sock file isn't correctly being removed. Doing an `rm` on that file mentioned in the error message will be enough to get you going again.

```sh
Error: error creating build container: short-name resolution enforced but cannot prompt without a TTY
```

Ok, this is the big one and the major issue you'll likely hit making the switch today from Docker to Podman. Lets dive into it in a bit more detail...

## short-name resolution

First we need to understand what a short-name is in this context. It refers to container images that don't have a full domain name prefixed. You've likely come across these quite a lot before - e.g. `alpine:latest`, `ubuntu:12`, `giantswarm/pause:latest`, etc.

When using Docker, these images are actually first prefixed with `docker.io` (or `docker.io/library` for those official images without a namespace) before being pulled.

Podman doesn't have this as a default. It can work in the same way as Docker but needs a bit of configuring.

It's worth breifly pausing here to explain _why_ this behavior is different. Podman takes the **secure by default** attitude to configuration and installation, and this difference is a prime example of that mindset. You've likely heard in the news over the past few years about some of the supply chain hacks that have had a big impact on some companies and projects. One of the common attack vectors is tricking users into installing what they think is a legitimate package but actually contains malicious code. The use of short names for images opens up the risk of accidentally pulling the wrong image from the wrong registry.

To mitigate this risk Podman has a feature where it will prompt you asking which registry you'd like to pull the shot named image from and will then save that choice to speed things up later. (On a side note, there's a repo where the community is trying to collate a collection of some of the most widely used shortcodes - https://github.com/containers/shortnames)

So, Podman has this handy feature to help out with security so why are we seeing an error? Well, when running Podman on MacOS (or Windows) we're actually running it in a Linux VM and remotely connecting to Podman running in that machine. Because of this we don't have an interactive terminal with the underlying Podman engine so it is unable to recieve our choice if it asked us which registry to use.

### Fix

There's a couple of solutions for this:

1. Instead of using short names we could switch to using fully prefixed images (this includes updating any `FROM` commands in our Dockerfiles also).

2. The other approach is to reduce this security feature to be on-par with the experience we're used to with Docker.

As the first solution really just relies on you changing the image names you're referencing, which will depend on how you're working, I'll focus on the second solution.

With our machine created and started (as outlined above) we need to access the machine to make a small configuration change. Thankfully Podman makes this quite easy:

```sh
podman machine ssh
```

This will drop you into an SSH session within the virtual machine created for Podman. Once in this machine we want to make a change to the `/etc/containers/registries.conf` file. If we take a look at the file contents we'll see the final lines of it (at time of writing this) as followed:

```
# Enforcing mode for short names is default for Fedora 34 and newer
short-name-mode="enforcing"
```

The `short-name-mode` property has 3 possible values:

* **enforcing**: If no alias is found and more than one unqualified-search registry is set, prompt the user to select one registry to pull from. If the user cannot be prompted (i.e., stdin or stdout are not a TTY), Podman will throw an error.
* **permissive**: Behaves as enforcing but will not throw an error if the user cannot be prompted. Instead, Podman will try all unqualified-search registries in the given order. Note that no alias will be recorded.
* **disabled**: Podman will try all unqualified-search registries in the given order, and no alias will be recorded. This is pretty much the same behavior of Podman before short names were introduced.

If we want Podman to perform more like Docker we'll want to change this value to `permissive`:

```sh
sudo sed -i 's/short-name-mode="enforcing"/short-name-mode="permissive"/g' /etc/containers/registries.conf
```

There's one more property in this file that it's worth at least being aware of.

```
unqualified-search-registries = ["registry.fedoraproject.org", "registry.access.redhat.com", "docker.io", "quay.io"]
```

This property contains a list of all the registries that will be checked (in order) when looking up a short name image. **Be sure the values in here are ones that you trust!**

With that change made we can `exit` from the virtual machine and Podman should then search for any short name images using these registries from now on.

## Wrap Up

I'm sure there's many more inconsistencies but so far I'm pretty impressed. I'm plan to try using Podman instead of Docker for a while and see how I get on. I'll try and update this post with anything more I find out.

If anyone wants to share their experiences with Podman please reach out to me on Twitter at [@Marcus_Noble_](https://twitter.com/Marcus_Noble_).

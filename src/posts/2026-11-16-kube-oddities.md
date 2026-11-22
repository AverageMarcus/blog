---
layout: post.html
date:  2026-11-16
title: Kube-Oddities
tags: Kubernetes
summary: |
  This blog post comes from a talk me and [Márk Sági-Kazár](https://www.linkedin.com/in/sagikazarmark/) have given a few times now called **[Kube-Oddities: The Quirks That Keep Kubernetes Interesting](https://youtu.be/ueMKtSDVhlw?si=o4cHlTMt1RHQpsxT)**. That talk itself was inspired by a previous talk I had given called **[Pod Deep Dive: The Interesting Bits](https://youtu.be/E_r56x92KZw?si=lQP343hFHrYv2V9J)**. In this post I will go through all the fun, weird and quirky things we found out while putting together both these talk.

  Over our combined many years of working with Kubernetes, me and Márk have seen some weird things. Many resulting in us scratching our head and going "WTF?". Regardless of if you're brand new to the cloud native world or you're a Kubernetes veteran I hope you'll find something interesting in this post - or at the very least a shared frustration! 😁

---

<!--
<details>
<summary>Changelog</summary>
</details>
-->

This blog post comes from a talk me and {{> sociallink avatar="/images/avatars/mark.jpg" link="https://www.linkedin.com/in/sagikazarmark/" name="Márk Sági-Kazár" }} have given a few times now called **[Kube-Oddities: The Quirks That Keep Kubernetes Interesting](https://youtu.be/ueMKtSDVhlw?si=o4cHlTMt1RHQpsxT)**. That talk itself was inspired by a previous talk I had given called **[Pod Deep Dive: The Interesting Bits](https://youtu.be/E_r56x92KZw?si=lQP343hFHrYv2V9J)**. In this post I will go through all the fun, weird and quirky things we found out while putting together both these talk.

Over our combined many years of working with Kubernetes, me and Márk have seen some weird things. Many resulting in us scratching our head and going "WTF?". Regardless of if you're brand new to the cloud native world or you're a Kubernetes veteran I hope you'll find something interesting in this post - or at the very least a shared frustration! 😁

---

## Pods

### Sidecar Containers

Sidecar containers are secondary containers that run within a Pod alongside your application container. The concept was popularised by the Istio service mesh in the earlier days and, as of Kubernetes v1.29, sidecars are officially supported and native.

I'm sure if you've used Kubernetes before you're already familiar with Pods and `containers`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
spec:
  containers:
    - name: application
      image: my-awesome-app:latest
```

You may have also come across `initContainers`. These allow us to setup our Pod environment before our application starts - things such as cache populating, pre-downloading assets, configuring networking, etc.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
spec:
  initContainers:
    - name: iptables-setup
      image: alpine
  containers:
    - name: application
      image: my-awesome-app:latest
```

So, following that logic we should be able to add our new sidecars like this:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
spec:
  initContainers:
    - name: iptables-setup
      image: alpine
  containers:
    - name: application
      image: my-awesome-app:latest
  sidecarContainer:
    - name: service-mesh
      image: istio:latest
```

Well... no. I'm afraid not. 😒 Instead, we *actually* re-use the `initContainers` property! 🤨

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
spec:
  initContainers:
    - name: iptables-setup
      image: alpine
    - name: service-mesh
      image: istio:latest
      restartPolicy: Always
  containers:
    - name: application
      image: my-awesome-app:latest
```

Those of you paying attention may have noticed something different about the `service-mesh` container. The "magic" here is the  `restartPolicy: Always` on the init container - this is what makes it an official sidecar container. There is no other value you can set this to. It's either `Always` (sidecar) or doesn't exist (init).

This property instructs Kubernetes to start your sidecar right at the start just like every other initContainer but rather than it ending and your application container starting up it instead **keeps running** when your application container starts - and continues right until Pod termination.

Now, this is not to be confused with `restartPolicy` that you can set at the Pod spec level either, That's something completely different. Naming is hard, right? (This is going to become a recurring theme 😉)

I really hate this approach. It's non-obvious, easy to miss and assumes you already know how to configure sidecar containers. 😞 _sigh!_

### Image Tags & SHAs

It's recommended best practice to use image SHAs rather than solely relying on tags. A SHA-based image tag ensures exactly the same image is used each time, even if the tag is later overwritten, as the SHA is determined from the actual contents of the image. One byte changes in the image and the SHA changes.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: “tiny-pod”
spec:
  containers:
    - name: “nginx”
      image: “nginx:1.25.1@sha256:9d6b58feebd2db[…]2072c9496”
```

The gotcha: if a SHA is used, the tag is completely ignored by Kubernetes. The tag may no longer match the SHA. Take extra caution if you use dependency update tools and make sure both the tag and the SHA is being update together so that both your humans and Kubernetes are aligned on which version is being used.

### Pod Volumes: Spot the Mistake

Now it's time for a little game. Below you will find two Pod manifests, each mounting a volume. There is a single mistake in this example - can you find it?

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: "demo-pod-with-configmap"
spec:
  containers:
    - name: demo
      image: nginx
  volumes:
    - name: config-vol
      configMap:
        name: demo-html
---
apiVersion: v1
kind: Pod
metadata:
  name: "demo-pod-with-secret"
spec:
  containers:
    - name: demo
      image: nginx
  volumes:
    - name: secret-vol
      secret:
        name: demo-html
```

<details>
<summary>Answer</summary>

The Secret volume mount is wrong, it should look like this:

```yaml
volumes:
  - name: secret-vol
    secret:
      secretName: demo-html
```

That's right, for secrets you need to use `secret.secretName` but for ConfigMaps you just use `configMap.name`.

🤷‍♂️

Naming is hard, right?

</details>

### EmptyDir with Memory Backing

You've likely come across `emptyDir` at some point. An `emptyDir` volume is ephemeral storage that lasts the life of the pod. Often used for temporary storage, cache and sharing of files between containers within a single Pod. Very useful!

But what you might not know is it can be backed by memory using `medium: Memory`, which is faster since there's no disk I/O.

But if you don't set resource limits on your Pod, that memory-backed volume can easily exhaust the memory available on the node. 😱 Accidentally pull a multi-gigabyte file or don't correctly set up temp file cleanup and you can starve other workloads running alongside this Pod.

With resource limits set, the container will be OOM'd when it reaches the memory limit, regardless of whether the usage is from the container memory or the `emptyDir` storage.

To take things one step further, you can set a limit on the `emptyDir` itself using `sizeLimit` which, if reached, results in an I/O error of no free space, rather than an OOM kill of the Pod. Much nicer!

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: "demo-pod"
spec:
  containers:
    - name: demo
      image: nginx
      volumeMounts:
      - name: data
        mountPath: /data
  volumes:
    - name: data
      emptyDir:
        medium: Memory
        sizeLimit: 500Mi
```

---

## Networking

### Setting a Pod Hostname

A property I don't see used much is `.spec.hostname` and `.spec.subdomain`. These two properties allow you to control the hostname set inside containers of a Pod.

For example, with the following Pod spec:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: demo-pod
  namespace: default
spec:
  hostname: demo
  subdomain: example
  containers:
    - name: demo
      image: nginx
```

The container will see the following hostname:

```shell
/# hostname -A
demo.example.default.svc.cluster.local
```

Without setting these properties, the Pod name is used as a default. E.g.

```shell
/# hostname -A
demo-pod.default.svc.cluster.local
```

Awesome! So we can now reach our Pod by calling `demo.example.default.svc.cluster.local` right? 😅 Errr... well... no. Unfortunately not.

This hostname is only used *inside* the Pod it is set on. CoreDNS doesn't use these properties as part of it's DNS resolution. In fact, you can't actually resolve Pod IPs directly so not even the default `demo-pod.default.svc.cluster.local` will work - routing can only be to Services.

BUT, let me introduce you to "headless services"! These are a special kind of Kubernetes Service resource that has `clusterIP: None` set. This sits in front of your Pods and actually makes each one of them available as a DNS entry.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: headless
  namespace: loki
spec:
  clusterIP: None
  selector:
    app: loki
  ports:
    - port: 80
```

We can then use this service to lookup all Pods behind it. As you can see below, we currently have 3 replicas available.

```shell
bash-5.0# nslookup headless.loki.svc.cluster.local
Server:         10.96.0.10
Address:        10.96.0.10#53

Name:   headless.loki.svc.cluster.local
Address: 10.244.7.90
Name:   headless.loki.svc.cluster.local
Address: 10.244.4.67
Name:   headless.loki.svc.cluster.local
Address: 10.244.5.247
```

But it gets better! If we know the name of one of the Pods (`pod-0` in the below example) we can directly resolve that specific Pod like so:

```shell
bash-5.0# nslookup pod-0.headless.loki.svc.cluster.local
Server:         10.96.0.10
Address:        10.96.0.10#53

Name:    pod-0.headless.loki.svc.cluster.local
Address: 10.244.7.90
```

But remember: when you set a hostname in the Pod spec, it only exists within the pod itself. It's not DNS-resolvable.

### DNS Policy Quiz

It's time for another game! 🎉

This time it's a simple multiple choice quiz.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: "demo-pod"
spec:
  dnsPolicy: ????
  containers:
    - name: demo
      image: nginx
```

What is the *default* value for the `.spec.dnsPolicy` property if not set?

1. Default
2. ClusterFirst
3. ClusterFirstWithHostNet
4. None

Hint: These are all valid values that can be used with this property.

<details>
<summary>Answer</summary>

✨ `ClusterFirst` ✨

<br/>

😒 Have I said naming is hard?

<br/>

The default value of `dnsPolicy` is `ClusterFirst`, which is why Kubernetes DNS can resolve service names for you. If you set it to `Default` it inherits the host node's DNS config with no knowledge of Kubernetes services and endpoints.

</details>

---

## Security

> Big shout out to [Rory McCune](https://www.linkedin.com/in/rorym/) who I learnt many of the security related oddities from. I highly recommend following their [blog](https://raesene.github.io) or their [talks](https://www.mccune.org.uk/talks/).

### Irrevocable Credentials

What if I told you it was possible to create credentials in Kubernetes that couldn't be revoked?

😱

Let me introduce you to the [Token Request API](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_token/):

```shell
kubectl create token node-controller -n kube-system
```

Congratulations! 🎉 You now have a JWT auth token associated with the node-controller Service Account that cannot be revoked!

Let's take a look at what we can do..

```shell
kubectl auth whoami
ATTRIBUTE         VALUE
Username          system:serviceaccount:kube-system:node-controller
UID               bf9b4829-fdb8-41ca-a9c9-dfd2eb7a417a
Groups            [system:serviceaccounts system:serviceaccounts:kube-system system:authenticated]

kubectl auth can-i get pods
yes

kubectl auth can-i delete pods
yes

kubectl auth can-i create pods
no

kubectl auth can-i delete nodes
yes
```

Ok, there's some destructive operations there. Not something I would want hanging around forever if leaked. 😅

The only way to remove the credentials…

```shell
kubectl delete serviceaccount -n kube-system node-controller
```

I don't know about you but I don't really feel comfortable deleting the `node-controller` ServiceAccount. Who knows what that might break!

The only alternative is to wait for the credentials to expire. Hopefully you’ve set sensible defaults.

```
--service-account-max-token-expiration: "24h"
```

### RBAC: The Escalate Verb

If you have a user / ServiceAccount that has the permissions to create Roles / ClusterRoles they cannot, thankfully, use this ability to escalate their own permissions by creating a role with more access. Kubernetes says no! 🙅 Well done Kubernetes maintainers!

Unless...

Let me introduce you to the `ESCALATE` verb. If you have this verb then you are allowed to create roles with more permissions than you already have!

Be careful when using `*` as this also includes the `ESCALATE` verb.

```yaml
- apiGroups:
  - 'rbac.authorization.k8s.io'
  resources:
  - '*'
  verbs:
  - '*'
```

If you happen to have this you’ve got superpowers! You can now edit your own (Cluster)Roles with whatever you want!

### Static Manifests and Hidden Pods

Static manifests let you define Pods that will run on a node, managed directly by the Kubelet on that node rather than the Kubernetes API server. The Kubelet attempts to create a "mirror pod" on the API server as a read-only view of the Pod it created. But this is a best-effort attempt.

If the mirror pod creation fails, the pod won't show up in `kubectl get pods`. Which means... you can create *hidden pods*. 😱

For example, the following static Pod references a namespace that doesn't exist in the cluster itself:

```yaml
apiVersion: v1
kind: Pod
metadata:
 name: "demo-pod"
 namespace: "not-a-namespace"
spec:
 dnsPolicy: ClusterFirst
 containers:
   - name: demo
     image: nginx
```

The kubelet happily creates this Pod on the node and runs the containers, as it has no knowledge of the namespaces, but when it tells the Kubernetes API to create the mirror pod it fails.

```shell
$> kubectl get pods -n not-a-namespace
No resources found in not-a-namespace namespace.

$> kubectl get namespace not-a-namespace
Error from server (NotFound): namespaces "not-a-namespace" not found
```

The static manifests directory should already be heavily protected so this _shouldn't_ be an issue but it's worth knowing about.

---

## Wrap Up

I hope you've enjoyed these oddities and aren't now too frustrated. 😅

If you have your own Kube-Oddities I'd love to hear them! Please do get in touch with me.

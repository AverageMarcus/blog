---
layout: post.html
date:  2025-09-28
title: Investigating and fixing "StopPodSandbox from runtime service failed" Kubelet errors
tags: Kubernetes, Kubelet, CNI
summary: |
  For months now (maybe years, who knows 🤷) I've had the following error sprinkled throughout my Kubelet logs across multiple of my worker nodes:

  ```plain
  StopPodSandbox from runtime service failed: rpc error: code = Unknown desc = failed to destroy network for sandbox "055b221e44a28ce8d9120f771d5e1ef201f2457ce49c58999a0147104cca2708": failed to get network "cbr0" cached result: decoding version from network config: unexpected end of JSON input
  ```

  As there has never been any associated impact with this that I could see I just ignored it... for a long time!

  Well, fast forward to last Friday night where a sudden hyper-focus hit and I decided I wanted to know what was going on and how to stop it - here's how it went.


---

For months now (maybe years, who knows 🤷) I've had the following error sprinkled throughout my Kubelet logs across multiple of my worker nodes:

```plain
StopPodSandbox from runtime service failed: rpc error: code = Unknown desc = failed to destroy network for sandbox "055b221e44a28ce8d9120f771d5e1ef201f2457ce49c58999a0147104cca2708": failed to get network "cbr0" cached result: decoding version from network config: unexpected end of JSON input
```

As there has never been any associated impact with this that I could see I just ignored it... for a long time!

Well, fast forward to last Friday night where a sudden hyper-focus hit and I decided I wanted to know what was going on and how to stop it - here's how it went.

## A little context

Before we dive into things I think it's worth providing a bit of context first so we all know what we're working with. The Kubernetes cluster in question is my "homelab" cluster that is running [Talos Linux](https://www.talos.dev) within a [Proxmox](https://www.proxmox.com/en/) cluster. The cluster has a single control plane node and 5 worker nodes. The worker nodes are where we'll be focussing. Beyond that there's nothing too special about this cluster. CNI is provided by [Flannel](https://github.com/flannel-io/flannel) with default configuration. The only thing that is kinda unusual is my use of [SMB for my CSI driver](https://github.com/kubernetes-csi/csi-driver-smb) - I only mention this because it's possible that a failure here _might_ have been the thing that trigger the initial issue but I don't know for sure.

## Identifying the issue

As I sad, I had ignored this for months and not thought much of it until Friday. I was cleaning up some unrelated stuff in my cluster and was checking my Kubelet logs stored in [Loki](https://grafana.com/docs/loki/latest/) to see if my cleaning up had been applied. This is how I (re-)noticed the high number of sandbox errors from various Kubelets. So I took a closer look with:

```promql
{service="kubelet"} |= "failed to get network \"cbr0\" cached result"
```

There was a LOT of these errors in the logs, almost 1000 per hour! 😳

Even though there was a lot of errors there was actually only a handful of sandbox IDs causing the problem so it wasn't widespread, just frequent.

## Figuring out what was wrong

Because I'm a Professional Kubernetes Platform Engineer™ I knew exactly how to tackle this... ask the internet! So fired up DuckDuckGo, pasted in my error message and started wading through a LOT of useless results.

* I found a couple [similar](https://github.com/projectcalico/calico/issues/4084) [issues](https://github.com/projectcalico/calico/issues/7647) that people had experienced with Calico but didn't seem to fit what I was seeing.
* There was a [closed issue](https://github.com/containerd/containerd/issues/6565) against Containerd where [this comment](https://github.com/containerd/containerd/issues/6565#issuecomment-1632089810) gave me some hope in solving it with a loopback CNI but turned out unrelated also.

These did give me enough info to start looking in the right places though. There was just one problem - Talos Linux doesn't have a shell you can SSH into, it's all API driven.

`kubectl debug` to the rescue!!!

Thankfully, it's possible to mimic an SSH session using `kubectl debug` against the node. As I knew I'd need a bunch of container-related tools to help with debugging I launched a debug container using the [alpine-containertools](https://github.com/raesene/alpine-containertools) image from [Rory McCune](https://www.mccune.org.uk). Due to how the debug command mounts the host filesystem I also had to override the `CONTAINER_RUNTIME_ENDPOINT` environment variable to point to the correct location.

```bash
kubectl debug -it --image raesene/alpine-containertools \
  --env CONTAINER_RUNTIME_ENDPOINT=unix:///host/run/containerd/containerd.sock \
  node/talos-192-168-1-15 \
  -- sh
```

Now we can start poking around on the node. First, lets see if we can force delete the sandbox pod ourself.

```bash
crictl rmp --force 055b221e44a28ce8d9120f771d5e1ef201f2457ce49c58999a0147104cca2708

Failed to stop sandbox before removing: rpc error: code = Unknown desc = failed to destroy network for sandbox "055b221e44a28ce8d9120f771d5e1ef201f2457ce49c58999a0147104cca2708": failed to get network "cbr0" cached result: decoding version from network config: unexpected end of JSON input
```

No luck! But we've been able to reproduce what Kubelet is hitting at least.

I spent a bit more time poking at `crictl` to get an understanding of the state of things. Doing so I was able to identify which pods were broken on each node.

```bash
# Get the full details about the pod in containerd
crictl inspectp --output=json 055b221e44a28ce8d9120f771d5e1ef201f2457ce49c58999a0147104cca2708
# List all pods known to containerd, and filter to those in a Notready state
crictl pods | grep NotReady
```

Eventually, after wading through all the unrelated search results one did seem relevant, a GitHub issue on `containerd`: "[Empty cache files causes "KillPodSandbox" errors when deleting pods](https://github.com/containerd/containerd/issues/8197)".

## Cleaning things up

This final GitHub issue contained one important piece of information I was missing - the location of the network cache: `/var/lib/cni/results`. This is the directory where the CNI stores a JSON file for each network it creates. So let's go take a look:

```bash
> ls -la /host/var/lib/cni/results

total 148
drwx------    2 root     root          4096 Sep 27 05:48 .
drwx------    5 root     root            52 Jun 23  2022 ..
-rw-------    1 root     root          1647 Sep 27 05:47 cbr0-01d576d2f808a969bb7cb8da11d1ee3117ec4e9792d4aea33abec55318b74e01-eth0
-rw-------    1 root     root             0 Jun 15 21:28 cbr0-055b221e44a28ce8d9120f771d5e1ef201f2457ce49c58999a0147104cca2708-eth0
-rw-------    1 root     root          1608 Sep 27 05:48 cbr0-225486a2df0c2c8be5038245d099b4c48dc03ede648735a2b4676154650e7741-eth0
-rw-------    1 root     root          2045 Sep 27 05:46 cbr0-2e848e89543e7b6491d0b47eb2be7ec620865024d942012303ede16842aa1108-eth0
-rw-------    1 root     root          1638 Sep 27 05:48 cbr0-415cd18f24ec2740486a7bf254054f871bd8abe4c26bc6e27dbf1f5a10c29f69-eth0
-rw-------    1 root     root          1638 Sep 27 05:46 cbr0-47d021d26d2d1935025cee58941ff68ad28e09f1337b867e0865be56dde64a2a-eth0
-rw-------    1 root     root          1616 Sep 27 05:46 cbr0-5d40d2f86c6f4be7a85969f24e844ea049b41af14b97cfa3f5a655f52d4fc695-eth0
-rw-------    1 root     root          1616 Sep 27 05:48 cbr0-68f252ab057496036e8852a4f6103c1b6c564f6976d04676010858a5588a9a10-eth0
-rw-------    1 root     root          1596 Sep 27 05:48 cbr0-91d8805fe4b95c92f4c53e1321813b5fe9f71467c5692328bb7646649db57b22-eth0
-rw-------    1 root     root          1764 Sep 27 05:48 cbr0-a0eaa73bd701c9b1b1167efd49487b48074936211de1c6be37beec5184e42691-eth0
```

Notice anything suspicious? The file size of the file associated with our failing sandbox ID is `0`. 🤔 That explains why the CNI is unable to load from the cache then - it's empty. Taking a quick look at one of the other files shows a valid JSON object with various network configuration stored within.

So lets delete this file - `rm -rf /host/var/lib/cni/results/cbr0-055b221e44a28ce8d9120f771d5e1ef201f2457ce49c58999a0147104cca2708-eth0`

With that gone, let's try again to delete the pod:

```bash
crictl rmp 055b221e44a28ce8d9120f771d5e1ef201f2457ce49c58999a0147104cca2708

Removed sandbox 055b221e44a28ce8d9120f771d5e1ef201f2457ce49c58999a0147104cca2708
```

SUCCESS! 🎉

Now we know what to clean up it's time to repeat the process for each filing sandbox ID on each node. Once that is done the kubelet logs are looking _muuuucccchhhhhhh_ better!

## Preventing this happening again

As I'm still unclear why or how these pods first failed I can't be sure it wont happen again. My current leading theories are it was either caused by a previous power failure that left the nodes in a bad state or was related to my NAS crashing as the few pods I took a close look at all had SMB volumes associated with them.

Regardless of what caused it I want to make sure I'm being more proactive going forward and leaving my cluster in a better state than it was before. I could set up a dashboard that includes the log query from Loki that we used at the start of this post but that requires me to check it often and... I'm lazy. What we really want is some alerts to annoy me when / if this happens again.

I already have quite a decent monitoring and alerting setup in my homelab made up of [VictoriaMetrics](https://victoriametrics.com), [AlertManager](https://prometheus.io/docs/alerting/latest/alertmanager/) and various metric exporters so I'm in a good starting point.

But what I am lacking is containerd metrics.

A quick search lead me to this [great post](https://collabnix.com/monitoring-containerd/) by Abraham Dahunsi covering a lot of details about monitoring containerd. This gave the information on what metrics to work with and what I can do with them but I was still missing the actual metrics. In Talos Linux the containerd metrics aren't enabled by default but thankfully it's [quite simple to enable](https://www.talos.dev/v1.11/talos-guides/configuration/containerd/), I just needed to add the following to my machine config for each of my nodes:

```yaml
machine:
  files:
    - content: |
        [metrics]
          address = "0.0.0.0:11234"
      path: /etc/cri/conf.d/20-customization.part
      op: create
```

I then just need to instruct [vmagent](https://docs.victoriametrics.com/victoriametrics/vmagent/) to scrape this new endpoint:

```yaml
    scrape_configs:
    - job_name: containerd
      scrape_interval: 30s
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      kubernetes_sd_configs:
      - role: node
      relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
      - target_label: __address__
        replacement: kubernetes.default.svc:443
      - source_labels: [__meta_kubernetes_node_name]
        regex: (.+)
        target_label: __metrics_path__
        replacement: /api/v1/nodes/${1}:11234/proxy/v1/metrics
      - source_labels: [__meta_kubernetes_node_name]
        action: replace
        target_label: kubernetes_node
```

Now I have the metrics coming in, we can put them to use at identifying issues.

**Identify failures starting a pod sandbox:**

```promql
sum by(grpc_code, instance) (
  rate(grpc_server_handled_total{job="containerd", grpc_code!="OK", grpc_method="RunPodSandbox"})
) > 0
```

**Identify failures stopping or removing a pod sandbox:** (This is the issue we handled in this post)

```promql
sum by(grpc_code, grpc_method, instance) (
  rate(grpc_server_handled_total{job="containerd", grpc_code!="OK", grpc_method=~"StopPodSandbox|RemovePodSandbox"})
) > 0
```

**Find all pods known to containerd that aren't known to Kubernetes:**

```promql
(
  container_pids_current{namespace="k8s.io"}
    unless on (container_id)
    label_replace(
        kube_pod_container_info,
        "container_id", "$1", "container_id", "containerd://(.+)"
    )
    unless on (container_id)
    label_replace(
        kube_pod_init_container_info,
        "container_id", "$1", "container_id", "containerd://(.+)"
    )
)
unless on (container_id)
(
  container_memory_swap_limit_bytes > 0
)
```

This last one has a lot going on but it breaks down to:

1. List all `pids` counts for all containers in the `k8s.io` namespace in containerd
2. Unless the `container_id` is also found on the `kube_pod_container_info` metric (where we need to strip the `containerd://` prefix)
3. Or the `container_id` is also found on the `kube_pod_init_container_info` metric
4. And finally only if the `container_memory_swap_limit_bytes` is greater than 0 which will filter out the sandbox containers (pause container) which aren't exposed to Kubernetes anyway.

These three then become new alerts that can notify me if any match.

```yaml
- name: containerd
  rules:
  - alert: ContainerdPodStartFailed
    annotations:
      description: |
        Containerd on **{​{ .Labels.instance }}** has failed to start a pod sandbox due to **{​{ .Labels.grpc_code }}**.
    expr: |
      sum by(grpc_code, instance) (rate(grpc_server_handled_total{job="containerd",grpc_code!="OK", grpc_method="RunPodSandbox"})) > 0
    for: 5m
    labels:
      severity: notify

  - alert: ContainerdPodRemoveFailed
    annotations:
      description: |
        Containerd on **{​{ .Labels.instance }}** has failed to {​{ .Labels.grpc_method }} due to **{​{ .Labels.grpc_code }}**.
    expr: |
      sum by(grpc_code, grpc_method, instance) (rate(grpc_server_handled_total{job="containerd", grpc_code!="OK", grpc_method=~"StopPodSandbox|RemovePodSandbox"})) > 0
    for: 5m
    labels:
      severity: notify

  - alert: ContainerdHasLeftoverContainersRunning
    annotations:
      description: |
        Containerd on **{​{ .Labels.instance }}** has extra containers that aren't known to Kubernetes.
    expr: |
      (
        container_pids_current{namespace="k8s.io"}
          unless on (container_id)
        label_replace(
            kube_pod_container_info,
            "container_id", "$1", "container_id", "containerd://(.+)"
        )
        unless on (container_id)
        label_replace(
            kube_pod_init_container_info,
            "container_id", "$1", "container_id", "containerd://(.+)"
        )
      )
      unless on (container_id)
      (
        container_memory_swap_limit_bytes > 0
      )
    for: 15m
    labels:
      severity: notify
```

## This I learnt

I'd never really used `crictl` much before this so it was good to be able to better understand it. One thing I didn't realise was it also has the concept of "pods" and "containers" which are different, but map to, those found in Kubernetes. A "pod" seems to refer to the sandbox container - that is, the container that is created to setup all the networking etc. that is needed for the workloads (this is the "pause container"). Pods can be listed with `crictl pods` and inspected with `crictl inspectp [ID]`. Containers can be listed with `crictl ps` and inspected with `crictl inspect`.

Before this I didn't really know what a CNI _actually did_ in terms of things it created etc., and I still mostly don't, but I've at least seem some hints of it in the way of the network cache files that it creates.

Debugging Talos when it goes wrong at the host level is _tricky_ as you have limited access to the node itself. This is often good as it prevents you from being able to make live changes that could be forgotten or reverted accidentally but when you actually need to fix something like this it just gets in the way. I'm very thankful for `kubectl debug` (and Rory's wonderful `alpine-containertools` image 💙) that makes this debugging possible and relatively painless.

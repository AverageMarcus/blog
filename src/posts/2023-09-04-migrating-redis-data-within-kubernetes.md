---
layout: post.html
date:  2023-09-04
title: Migrating Redis data within Kubernetes
tags: kubernetes redis sentinel
summary: |
  I’ve recently been seeing some stability issues with Redis that I have running for the [k8s.social](https://k8s.social) Mastodon instances. After looking into it I realised that I had it configured in a master/replica architecture but I wasn’t actually making any use of the replicas as Mastodon was configured to do everything via the master. There’s two things wrong with this - firstly I’m wasting resources by having the replicas running but more importantly I created a single point of failure. When the Redis master went down, so did Mastodon.

  Not good!
---

I’ve recently been seeing some stability issues with Redis that I have running for the [k8s.social](https://k8s.social) Mastodon instances. After looking into it I realised that I had it configured in a master/replica architecture but I wasn’t actually making any use of the replicas as Mastodon was configured to do everything via the master. There’s two things wrong with this - firstly I’m wasting resources by having the replicas running but more importantly I created a single point of failure. When the Redis master went down, so did Mastodon.

Not good!

To improve on this situation I decided to switch to making use of [Redis Sentinel](https://redis.io/docs/management/sentinel/) to take advantage of its failover capabilities. I wanted to keep the same configuration for everything else so I was sure it would behave the same with Mastodon. This mainly meant I wanted to keep a **single endpoint** that Mastodon connected to Redis with and that Redis was configured with persistence in **Append Only File (AOF)** mode.

In most situations where I’ve used Redis it’s been as a caching layer so to switch to a new setup all I would need to do is point my app at the new endpoint. Mastodon, however, makes use of persistence in Redis and uses it as a data store for various things including users home feeds. So I needed to migrate across the existing data.


## Migration Steps

After hours of trial and error I finally got a set of steps to follow that allowed me to migrate the data safely with only a small windows of time where I missed out on new updates from the live server. This was acceptable for me in this instance but might not always be suitable so please keep that in mind.

> Before you plan to follow these steps yourself, please make sure you also take a look at the **Gotchas** below!

### Assumptions

* You are using the [Redis Helm chart by Bitnami](https://github.com/bitnami/charts/tree/main/bitnami/redis)
* You’re Redis instance is running in a Kubernetes cluster and it has enough resources available to run another instance alongside
* You have Redis configured in master/replica mode with Append Only File persistence.
* Your current Redis instance is deployed into the `redis` namespace.
* Your data is in the Redis database `1`

Not all of these are required to follow these steps (I wasn’t actually using the Helm charts) but it helps to establish some common groundwork.

### Steps


 1. Setup Redis Sentinel alongside old setup (ideally in a new namespace) with the following configuration changes:


    1. `appendonly` config set to `no` (we’ll change this later)
    2. Replicas set to `1`
 2. Once new PVC has been created and Redis has started scale down Redis Sentinel’s StatefulSet replicas to `0`
 3. On old Redis master, snapshot the current state:


    1. `kubectl exec -n redis -it redis-master-0 -- bash`
    2. `redis-cli -a ${REDIS_PASSWORD} -n 1 SAVE`
 4. On your local machine copy backup: `kubectl cp redis/redis-master-0:/data/dump.rdb ./dump.rdb`
 5. Launch a temporary pod that mounts the new PVC to upload dump into:

    ```go
    kubectl run --namespace redis-sentinel -i --rm --tty temp --overrides='
      {
          "apiVersion": "v1",
          "kind": "Pod",
          "metadata": {
              "name": "temp"
          },
          "spec": {
              "containers": [{
                 "command": [
                      "tail",
                      "-f",
                      "/dev/null"
                 ],
                 "image": "bitnami/minideb",
                 "name": "mycontainer",
                 "volumeMounts": [{
                     "mountPath": "/mnt",
                     "name": "redisdata"
                  }]
              }],
              "restartPolicy": "Never",
              "volumes": [{
                  "name": "redisdata",
                  "persistentVolumeClaim": {
                      "claimName": "redis-data-redis-node-0"
                  }
              }]
          }
      }' --image="bitnami/minideb"
    ```
 6. On your local machine upload backup to the temporary pod:


    1. `kubectl cp ./dump.rdb redis-sentinel/temp:/mnt/dump.rdb`
 7. Delete the temporary pod (`kubectl delete pod -n redis-sentinel temp`) and restore the Redis Sentinel’s StatefulSet to `1` replica
 8. Once the new Redis Sentinel is running, instruct it to switch to appendonly:


    1. `kubectl exec -n redis-sentinel -it redis-node-0 -- bash`
    2. `redis-cli -a $REDIS_PASSWORD -n 1 bgrewriteaof`

    (👆 This step seemed to be missing from all the backup/restore guides I found for Redis and was required to continue making use of the Append Only File.)
 9. Update the Redis Sentinel’s config to set `appendonly` back to `yes`
10. Restart the Redis Sentinel pod
11. Once Redis is up and running scale the StatefulSet back up to `3` (or however many replicas you plan to run)
12. Deploy [redis-sentinel-proxy](https://github.com/flant/redis-sentinel-proxy) to act as a single entrypoint to Redis that points to the current leader. (You can take a look at [my configuration](https://github.com/k8s-social/gitops/blob/18c201d815829b49e2b9f1316f1edac1e80a3d42/manifests/redis-sentinel/proxy.yaml#L46-L55C14) if you’re not sure how it needs to be set up)
13. Update your applications to point to the new redis-sentinel-proxy Service.


## Gotchas

### CoreDNS Changes

Redis Sentinel makes use of a [headless Kubernetes service](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services) to discover and connect to the Redis replicas. For this to work correctly, CoreDNS must be configured with `endpoint_pod_names` within the `kubernetes` block (see the [CoreDNS documentation](https://coredns.io/plugins/kubernetes/) for more info). This allows pods to be resolved by hostnames such as `redis-node-0.Redis-headless.redis.svc` instead of `1-2-3-4.redis-headless.redis.svc`.

If the `endpoint_pod_names` properly already exists in your CoreDNS config you don’t need to do anything but it wasn’t default in my cluster.

**Example:**

```go
kubernetes cluster.local in-addr.arpa ip6.arpa {
    pods insecure
    endpoint_pod_names
    fallthrough in-addr.arpa ip6.arpa
}
```

### Re-enabling `appendonly`

It turns out that simply re-enabling `appendonly yes` and performing a server restart will lead to all your previous data (in the dump.rdb) being ignored and Redis starting fresh with the Append Only File mode.

To get around this issue you must first inform Redis that you are enabling `appendonly` by performing `redis-cli -a $REDIS_PASSWORD -n 1 bgrewriteaof`.

This wasn’t mentioned in any of the backup / restore instructions I found for Redis until I came across “[Migrating to AOF from RDB with Redis](https://pellegrino.link/2020/06/10/2020-redis-persistence-migrating-rdb-to-aof.html)” by Laurent. I went through two attempts where I lost the data before I realised this was needed so I’m very thankful for discovering this post!

### No write endpoint

it turns out that Redis Sentinel, and more specifically the Bitnami Hem chart, doesn’t have a service specifically for the leader instance. This means if you attempt to use the `redis.redis-sentinel.svc` Service for both reads and writes you’ll eventually receive an error telling you that Redis is in read only mode as the service load balances across all the pods, not just the leader. Instead you’re expected to have your app query Sentinel to request the endpoint of the current leader. This was a problem for me as I couldn’t make changes to Mastodon to support this. Instead I deployed [redis-sentinel-proxy](https://github.com/flant/redis-sentinel-proxy) that acts as a small proxy to the current write-capable pod and updates as it fails over to a new pod.

There is now a slight concern that this has become the single point of failure. The proxy is fairly lightweight and launches quickly so I’m pretty confident that if errors do occur a replacement will be available quickly. I’ve made sure it is running with at least 2 replicas with a pod anti-affinity to hopefully avoid node failures taking it down.

### Migration window

I didn’t set up any replication from the old Redis to the new, instead I was making use of a snapshot from the old and restoring it into the new. Because of this there was a small window of time where new data was being created in the old Redis that wouldn’t be available in the new as I was in the process of switching over. For my purposes this was acceptable and I scheduled the move during a period of time I know saw less activity but I know this approach wont be suitable for all situations.

To minimize this window I worked with only a single Redis Sentinel replica during the migration and I set `sentinel.getMasterTimeout` to a very small value to ensure that first pod came up quickly so I could move traffic over. Just remember to put that timeout back up once you’re done!

### The scripts in the Helm chart didn’t work correctly

It’s entirely possible I did something wrong here but the `prestop` scripts within the Bitnami chart didn’t work correctly and weren’t actually triggering the failover on shutdown. I only discovered this while I was testing out [redis-sentinel-proxy](https://github.com/flant/redis-sentinel-proxy) and noticed there was a couple minutes where it was still attempting to connect to the old leader that had shutdown.

From what I could tell, the main thing missing was the prestop script for the Sentinel container didn’t trigger the failover command. In the end I decided not to use the Helm chart but instead use it to generate manifests to use directly. [You can see the scripts I use on GitHub](https://github.com/k8s-social/gitops/blob/18c201d815829b49e2b9f1316f1edac1e80a3d42/manifests/redis-sentinel/config.yaml#L466-L560).


## Summary

In the end, after a few hours of trial and error, the actual migration process was fairly smooth. I think I had a migration window of about a minute or less where new data was lost.

I was pretty annoyed that none of the backup / restore guides I came across actually handled the AOF issues. They all stated that it needed disabling at the start to generate the dump.rdb but there was then no mention about it for the resulting Redis instance upon restoring. Hopefully this post will help someone else avoid that issue in the future.

I found the Bitnami Helm chart to be a pain to work with. It has so many different configurations it was hard to know for sure what the result would be, plus the above issue about the scripts not working. I feel better having used it as a base and generating the yaml manifests to then further work with.

My only outstanding concern now is the redis-sentinel-proxy being a single point of failure. It’s only a small concern though, it has been running smoothly for the past few days now and it’s configured to be resilient enough to handle failures but I’ll be keeping an eye on this going forward.


If you’ve found this useful, or found issues with it, I’d love to hear! You can find me on Mastodon at [@marcus@k8s.social](https://k8s.social/@Marcus).


## Resources & References

* <https://docs.bitnami.com/kubernetes/infrastructure/redis/administration/backup-restore/>
* <https://github.com/bitnami/charts/tree/main/bitnami/redis>
* <https://hub.docker.com/r/flant/redis-sentinel-proxy> / <https://github.com/flant/redis-sentinel-proxy>
* [https://pellegrino.link/2020/06/10/2020-redis-persistence-migrating-rdb-to-aof.htm](https://pellegrino.link/2020/06/10/2020-redis-persistence-migrating-rdb-to-aof.html)

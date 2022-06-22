---
layout: post.html
title: "T.I.L. Tekton Multi-Arch Image Builds"
summary: "Today I Learnt: Tekton Multi-Arch Image Builds"
date: 2020-09-13T01:49:37+01:00
tags: til tekton docker

---

Using Buildkit to build multi-arch compatible images without Docker daemon:

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: docker-build-and-publish
  namespace: tekton-pipelines
spec:
  - name: IMAGE
    type: string
  resources:
    inputs:
    - name: src
      type: git
  steps:
  - name: build-and-push
    workingDir: /workspace/src
    image: moby/buildkit:latest
    env:
    - name: DOCKER_CONFIG
      value: /root/.docker
    command:
      - sh
      - -c
      - |
        buildctl-daemonless.sh --debug \
          build \
          --progress=plain \
          --frontend=dockerfile.v0 \
          --opt filename=Dockerfile \
          --opt platform=linux/amd64,linux/arm/7,linux/arm64 \
          --local context=. \
          --local dockerfile=. \
          --output type=image,name=$(params.IMAGE),push=true \
          --export-cache type=inline \
          --import-cache type=registry,ref=$(params.IMAGE)
    securityContext:
      privileged: true
    volumeMounts:
      - name: docker-config
        mountPath: /root/.docker/config.json
        subPath: config.json
  volumes:
    - name: docker-config
      secret:
        secretName: docker-config
```

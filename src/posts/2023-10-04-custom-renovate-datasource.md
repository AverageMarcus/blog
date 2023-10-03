---
layout: post.html
date:  2023-10-04
title: Custom Renovate datasource
tags: Renovate dependancies
summary: |
  I'm quite a fan of [Renovate](https://docs.renovatebot.com/) for automating my dependancy updates. I've been using it quite extensively - at [Giant Swarm](https://giantswarm.io/), with my personal infrastructure and with [k8s.social](https://k8s.social/) - to keep things up-to-date in the various Kubernetes clusters I manage. This has been working great for container images and Helm charts, with both being managed via GitOps and Renovate automating the version updates via PRs, but I have now found myself wanting to automate the updating of the Kubernetes version for my [Civo](https://www.civo.com/) cluster. Renovate doesn't have built in support for this but we can make it work with the use of custom datasources!
---

I'm quite a fan of [Renovate](https://docs.renovatebot.com/) for automating my dependancy updates. I've been using it quite extensively - at [Giant Swarm](https://giantswarm.io/), with my personal infrastructure and with [k8s.social](https://k8s.social/) - to keep things up-to-date in the various Kubernetes clusters I manage. This has been working great for container images and Helm charts, with both being managed via GitOps and Renovate automating the version updates via PRs, but I have now found myself wanting to automate the updating of the Kubernetes version for my [Civo](https://www.civo.com/) cluster. Renovate doesn't have built in support for this but we can make it work with the use of custom datasources!

Before we dig in to the Renovate configuration, lets take a look at what exactly we're trying to achieve...

## The Goal

All of the infrastructure for [k8s.social](https://k8s.social/) is managed in git and [available on GitHub](https://github.com/k8s-social/infra). The Civo Kubernetes cluster is managed using [Pulumi](https://www.pulumi.com/), using Go, and applied from a [GitHub Action](https://github.com/k8s-social/infra/blob/main/.github/workflows/deploy.yaml). The Kubernetes version is included in the [`main.go` file](https://github.com/k8s-social/infra/blob/e141372aea1e1399d6024f854b28b1fbdd50c70c/main.go#L94):

```golang
k8SCluster, err := civo.NewKubernetesCluster(ctx, "k8sCluster", &civo.KubernetesClusterArgs{
    Name:       pulumi.String("k8s.social"),
    KubernetesVersion: pulumi.String("1.27.1-k3s1"),
})
if err != nil {
    return err
}
```

(Lines removed for clarity)

So as you can see above, we're currently using the version `1.27.1-k3s1` but I'm aware that `1.28.2-k3s1` is now available to use. Rather than me having to update that value myself each time a new release is published (and to prevent me forgetting) lets have Renovate update that string for us automatically when it detects a new version.

## Getting the versions

The first thing we need, before we can even start on the Renovate configuration, is some way of getting a list of available versions. As Renovate supports using a JSON file from an URL (spoiler!) it would be best if we have an API we could call to get the versions.

As it turns out, Civo does have an [API you can call to get a list of versions](https://www.civo.com/api/kubernetes#list-available-versions). Unfortunately, this requires you to be authenticated when calling it and I'd rather not provide Renovate with my API token just to get a list of available versions.

Instead I put together a very quick API app, [civo-versions](https://github.com/AverageMarcus/civo-versions), that calls the Civo API with authentication and returns the versions as a JSON object. If y'all want to make use of it yourself it is available at `https://civo-versions.cluster.fun/`. (Different endpoints are available for different filtering, take a look at the [README.md](https://github.com/AverageMarcus/civo-versions/blob/main/README.md) for more info).

## Creating the custom datasource in Renovate

> ℹ️ **Note:** As I write this, Renovate is currently in the process of renaming / migrating the `regexManagers` to be `customManagers` ([see PR](https://github.com/renovatebot/renovate/issues/19066)). This made the documentation currently quite confusing and hard to follow as things aren't quite completed yet. For the purpose of this post I shall be using the old `regexManagers` which should still work for a while as there is a migration step built in to Renvoate to convert it to the new `customManagers`.

Now that we have somewhere that lists the available versions we can configure renovate!

For this to work we'll be making use of two properties in the Renovate configuration: [`customDatasources`](https://docs.renovatebot.com/configuration-options/#customdatasources) and [`regexManagers`](https://docs.renovatebot.com/configuration-options/#custommanagers).

```json
{
    "customDatasources": {

    },
    "regexManagers": [

    ]
}
```

According to the [documentation](https://docs.renovatebot.com/modules/datasource/custom/) the resulting JSON must match the following format (with the `version` being the only required field):

```json
{
  "releases": [
    {
      "version": "v1.0.0",
      "isDeprecated": true,
      "releaseTimestamp": "2022-12-24T18:21Z",
      "changelogUrl": "https://github.com/demo-org/demo/blob/main/CHANGELOG.md#v0710",
      "sourceUrl": "https://github.com/demo-org/demo",
      "sourceDirectory": "monorepo/folder"
    }
  ],
  "sourceUrl": "https://github.com/demo-org/demo",
  "sourceDirectory": "monorepo/folder",
  "changelogUrl": "https://github.com/demo-org/demo/blob/main/CHANGELOG.md",
  "homepage": "https://demo.org"
}
```

While Renovate does have capabilities to perform transformations on the JSON is retrieves I decided to make things easier and have `civo-versions` return the JSON in a compatible format to start with. Because of this, our `customDatasources` will look quite sparse:

```json
{
  "customDatasources": {
    "civo-k3s": {
      "defaultRegistryUrlTemplate": "https://civo-versions.cluster.fun/k3s/"
    }
  }
}
```

Here we're giving our custom datasource the name of `civo-k3s` and the `defaultRegistryUrlTemplate` points to the URL where we can get a list of the current k3s versions available from Civo. If our returned JSON wasn't already in the required format we could use `transformTemplates` to perform some manipulation of the data - see the [documentation](https://docs.renovatebot.com/modules/datasource/custom/) for more details if needed.

Now that we have our new custom datasource we can make use of it just like we would with the built in datasources.

We'll be using the regex manager to parse `main.go` and extract the line that contains our Kubernetes version string, then we'll then use our new custom datasource to replace the version if a newer one is found.

```json
{
  "customDatasources": {
    "civo-k3s": {
      "defaultRegistryUrlTemplate": "https://civo-versions.cluster.fun/k3s/"
    }
  },
  "regexManagers": [
    {
      "fileMatch": ["main.go"],
      "matchStrings": ["KubernetesVersion: pulumi.String\\(\"(?<currentValue>\\S+)-k3s1\"\\)"],
      "datasourceTemplate": "custom.civo-k3s",
      "depNameTemplate": "civo-k3s",
      "extractVersionTemplate": "^(?<version>.*)-k3s1$"
    }
  ]
}
```

In the above you can see the following:

* `fileMatch` tells Renovate which files we want to try and replace versions within.
* `matchStrings` is a list of regex strings to match on. The `(?<currentValue>\\S+)` capture group is used to extract the current version number that Renovate will replace.
* `datasourceTemplate` is the name of the datasource we want to use for this manager. For custom datasources it is the name we defined prefixed with `custom.`.
* `depNameTemplate` is the name to use for the dependancy. This will be used in the PR title / body for example.
* `extractVersionTemplate` is a regex string to perform on the new version.

## Putting it all together

With all this in place and committed into git we should now have Renoate creating [PRs to bump our Kubernetes version](https://github.com/k8s-social/infra/pull/28). 🎉

<figure class="center" markdown="1">

![Screenshot of PR opened by Renovate to update the Kubernetes version](/images/renovate-kubernetes-bump.png)

<figcaption>Renovate very quickly opened this PR as soon as the new configuration was pushed</figcaption>
</figure>

## Bonus

To make the use of this Civo version datasource easier for others I've added it to my [renovate-config](https://github.com/AverageMarcus/renovate-config) repo that contains reusable Renovate configuration presets.

My [Civo preset](https://github.com/AverageMarcus/renovate-config/blob/main/civo.json) contains multiple datasources covering both k3s and Talos cluster types as well as limiting the versions just to stable releases. To make use of the presets, add the following to your Renovate configs [`extends` property](https://github.com/k8s-social/infra/blob/e141372aea1e1399d6024f854b28b1fbdd50c70c/renovate.json#L6):

```
github>averagemarcus/renovate-config:civo
```

## Resources

* [Renovate custom datasource documentation](https://docs.renovatebot.com/modules/datasource/custom/)
* [Renovate `customManager` documentation](https://docs.renovatebot.com/configuration-options/#custommanagers)
* [Civo API documentation](https://www.civo.com/api/kubernetes#list-available-versions)
* [My personal Renovate presets](https://github.com/AverageMarcus/renovate-config)
* [civo-versions](https://github.com/AverageMarcus/civo-versions)

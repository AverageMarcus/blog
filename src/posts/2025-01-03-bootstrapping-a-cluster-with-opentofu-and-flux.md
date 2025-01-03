---
layout: post.html
date:  2025-01-03
title: Bootstrapping a Civo cluster with OpenTofu and Flux
tags: Kubernetes K8s Civo Flux OpenTofu GitOps IaC
summary: |
  As part of a side project I'm currently working on I needed to spin up a new Kubernetes cluster that I could manage via GitOps. I decided to take this opportunity to take a look at [OpenTofu](https://opentofu.org/) and see how it handles as it's been several years now since I last used Terraform. My plan was to use OpenTofu to scaffold a fairly basic [Civo](https://www.civo.com/) Kubernetes cluster and then use [Flux](https://fluxcd.io/) to handle installing workloads into the cluster. It took me a little trial-and-error so I thought I'd write up my final setup to help others avoid the issues and to help my future self when I come to do this again in a couple years!

---

As part of a side project I'm currently working on I needed to spin up a new Kubernetes cluster that I could manage via GitOps. I decided to take this opportunity to take a look at [OpenTofu](https://opentofu.org/) and see how it handles as it's been several years now since I last used Terraform. My plan was to use OpenTofu to scaffold a fairly basic [Civo](https://www.civo.com/) Kubernetes cluster and then use [Flux](https://fluxcd.io/) to handle installing workloads into the cluster. It took me a little trial-and-error so I thought I'd write up my final setup to help others avoid the issues and to help my future self when I come to do this again in a couple years!

If you'd rather skip this blog post and just see the final result you can find all the code in the repo [bootstrap-civo-cluster-blog-post-example](https://github.com/AverageMarcus/bootstrap-civo-cluster-blog-post-example).

## Pre-Requisites

For the purposes of this post the following are assumed:

* You have an account with Civo (if not, you [can sign up now](https://dashboard.civo.com/signup) and get **$250** credit to play with)
* You have your [Civo API Token](https://dashboard.civo.com/security) set as the `CIVO_TOKEN` environment variable in your terminal
* You have the OpenTofu CLI [installed](https://opentofu.org/docs/intro/install/)
* You have a GitHub repo created to contain all your GitOps source (this can be private, if you prefer)
* A [GitHub personal access token](https://github.com/settings/tokens)

## Repo Structure

First we'll setup our repo file structure so that we have the directories we need for all of our different GitOps resources.

From the root of your new repo:

```sh
mkdir -p {apps,flux,infra}
```

You should end up with something like the following:

```
📂 .
├── 📂 apps
├── 📂 flux
├── 📂 infra
```

## Infrastructure

The first thing we'll want to do is get our infrastructure setup using OpenTofu. All our infra code will live within our new `infra` directory so lets go ahead and create the files we'll be working with:

```sh
cd infra
touch main.tf # This is our main file containing our resources
touch providers.tf # This contains the config for the providers we will be using
touch variables.tf # This will describe any input variables we plan to use
touch output.tf # This contains all the output variables we will generate from our new infrastructure
```

With our new project ready lets setup start setting up the providers we will be using. For this we will be making use of two providers: [Civo](https://registry.terraform.io/providers/civo/civo/latest/docs) and [Flux](https://registry.terraform.io/providers/fluxcd/flux/latest/docs). In our `providers.tf` lets define each of these providers (along with their current versions at time of writing this).

```tf
terraform {
  required_providers {
    civo = {
      source  = "civo/civo"
      version = ">= 1.1.3"
    }
    flux = {
      source  = "fluxcd/flux"
      version = ">= 1.2"
    }
  }
}
```

We also need to configure each of the providers with various details. For now we're just going to add placeholders as they will reference some resources we haven't yet created so we'll come back to fill these in later. For now, add the following placeholders to the bottom of your `providers.tf` file:

```tf
provider "civo" {
}

provider "flux" {
}
```

With our providers defined we can now initialize our project and have the providers downloaded so we can start working.

```sh
tofu init
```

Once this is done you'll notice some new files have been created in our `infra` directory:

```
📂 .
├── 📂 .terraform
│  └── 📂 providers
├── 📄 .terraform.lock.hcl
├── 📄 main.tf
├── 📄 output.tf
├── 📄 providers.tf
└── 📄 variables.tf
```

The `.terraform.lock.hcl` is our [dependency lock file](https://opentofu.org/docs/language/files/dependency-lock/) that we will want to commit into git but the `.terraform` file contains the downloaded providers and ideally we would leave that out of our repo and generate it as needed. So lets take a moment to create a `.gitignore` in the root our of repo to ensure we are only going to commit the files we care about.

```
**/.terraform/*
*.tfstate
*.tfstate.*
*.tfvars
*.tfvars.json
.terraform.tfstate.lock.info
.terraformrc
terraform.rc
```

Great! Now lets start creating some infrastructure!

Let's move over to our `main.tf` where we're going to define three resources - a [Civo Network](https://registry.terraform.io/providers/civo/civo/latest/docs/resources/network), a [Civo Firewall](https://registry.terraform.io/providers/civo/civo/latest/docs/resources/firewall) and a [Civo Kubernetes Cluster](https://registry.terraform.io/providers/civo/civo/latest/docs/resources/kubernetes_cluster). In all of my examples, I will be using the imaginative name of `example` so replace it with whatever makes sense for you.

```tf
resource "civo_network" "example" {
  label = "example-network"
}

resource "civo_firewall" "example" {
  name                 = "example-firewall"
  create_default_rules = true
  network_id           = civo_network.example.id
}

resource "civo_kubernetes_cluster" "example" {
  name        = "ExampleCluster"

  firewall_id = civo_firewall.example.id
  network_id  = civo_network.example.id

  cluster_type       = "k3s"
  kubernetes_version = "1.30.5-k3s1"
  cni                = "flannel"

  write_kubeconfig = true

  pools {
    size       = "g4s.kube.small"
    node_count = 2
  }

  # This allows us to make use of cluster autoscaler.
  # If you don't plan to use cluster autoscaler you can remove this `lifecycle` block.
  lifecycle {
    ignore_changes = [
      pools["node_count"],
    ]
  }
}
```

It's looking good so far but before we attempt to create our infra we need to specify which Civo region we'll be using. Rather than specifying this on every resource we can configure it on our Civo provider which will then apply to all resources it creates if not set.

To make things more configurable, let's create a variable that we can use to set the region at runtime. In our `variables.tf` lets add a new `region` variable and give it a default value so we don't always need to provide it:

```tf
variable "region" {
  description = "The region to create all our Civo resources in"
  type        = string
  default     = "LON1"
}
```

With this in place we can return back to our `providers.tf` and set the region on our Civo provider by updating the `civo` placeholder we added earlier:

```tf
provider "civo" {
  region = var.region
}
```

We're now at a point where we could create some infrastructure. Lets first confirm everything is looking good by running `tofu plan` to get an overview of what will be created. You should see something similar to the following:

```
✨ tofu plan

OpenTofu used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

OpenTofu will perform the following actions:

  # civo_firewall.example will be created
  + resource "civo_firewall" "example" {
      + create_default_rules = true
      + id                   = (known after apply)
      + name                 = "example-firewall"
      + network_id           = (known after apply)
      + region               = (known after apply)
    }

  # civo_kubernetes_cluster.example will be created
  + resource "civo_kubernetes_cluster" "example" {
      + api_endpoint           = (known after apply)
      + cluster_type           = "k3s"
      + cni                    = "flannel"
      + created_at             = (known after apply)
      + dns_entry              = (known after apply)
      + firewall_id            = (known after apply)
      + id                     = (known after apply)
      + installed_applications = (known after apply)
      + kubeconfig             = (sensitive value)
      + kubernetes_version     = "1.30.5-k3s1"
      + master_ip              = (known after apply)
      + name                   = "ExampleCluster"
      + network_id             = (known after apply)
      + num_target_nodes       = (known after apply)
      + ready                  = (known after apply)
      + region                 = (known after apply)
      + status                 = (known after apply)
      + target_nodes_size      = (known after apply)
      + write_kubeconfig       = true

      + pools {
          + instance_names      = (known after apply)
          + label               = (known after apply)
          + node_count          = 2
          + public_ip_node_pool = (known after apply)
          + size                = "g4s.kube.small"
        }
    }

  # civo_network.example will be created
  + resource "civo_network" "example" {
      + cidr_v4        = (known after apply)
      + default        = (known after apply)
      + id             = (known after apply)
      + label          = "example-network"
      + name           = (known after apply)
      + nameservers_v4 = (known after apply)
      + region         = (known after apply)
    }

Plan: 3 to add, 0 to change, 0 to destroy.
```

Looking good! But, before we go ahead and apply this there's one more thing we should do first - define some outputs!

We would need at least a couple output values defined so we can access the new cluster. Lets create some outputs that report the cluster name, it's API endpoint and the KubeConfig file we can use to access it with `kubectl`. We'll define these in our `outputs.tf` file:

```tf
output "kubernetes_name" {
  value       = civo_kubernetes_cluster.example.name
  description = "The name of the Kubernetes cluster"
}

output "kubernetes_api_endpoint" {
  value       = civo_kubernetes_cluster.example.api_endpoint
  description = "The API endpoint of the Kubernetes cluster"
}

output "kubernetes_kubeconfig" {
  value       = civo_kubernetes_cluster.example.kubeconfig
  description = "The KubeConfig for the Kubernetes cluster"
  sensitive   = true
}
```

Note that for the `kubernetes_kubeconfig` we've set `sensitive = true`. This will prevent the contents from being printed out into any logs and leaking our credentials but will still be saved into the state so be careful.

Ok, I think we are ready to create some infra! You can choose to skip this and apply everything together at the end but if you want to check that things are working as expected you can run `tofu apply` and then follow the instructions output.

If all goes well you should see OpenTofu creating the new Civo Kubernetes cluster.

```
Apply complete! Resources: 3 added, 0 changed, 0 destroyed.
```

You may notice that a new file has also been created - `terraform.tfstate`. Assuming you correctly created the `.gitignore` earlier this file should be ignored by git and not committed into our repo as it will contain sensitive values!

Now is a good time to commit in your changes so far before moving on to the next section!

## Installing Flux

Now that we have a Kubernetes cluster created we can now have Flux installed into it to handle our GitOps'd workloads.

Go back to our `providers.tf` where we'll configure our Flux provider to make use of our new Kubernetes cluster. For this we are going to reference output values from our Civo Kubernetes Cluster and make use of two built in OpenTofu functions - [yamldecode](https://opentofu.org/docs/language/functions/yamldecode/) and [base64encode](https://opentofu.org/docs/language/functions/base64encode/).

```tf
provider "flux" {
  kubernetes = {
    host = civo_kubernetes_cluster.example.api_endpoint

    client_certificate = base64decode(
      yamldecode(civo_kubernetes_cluster.example.kubeconfig).users[0].user.client-certificate-data
    )
    client_key = base64decode(
      yamldecode(civo_kubernetes_cluster.example.kubeconfig).users[0].user.client-key-data
    )
    cluster_ca_certificate = base64decode(
      yamldecode(civo_kubernetes_cluster.example.kubeconfig).clusters[0].cluster.certificate-authority-data
    )
  }
}
```

As you can see above, we're making use of the `api_endpoint` output value for the host and we're using the `kubeconfig` output value with our two functions to parse the specific values we need from the yaml file and then encode them into base64 for use by Flux.

Flux also needs a git repo configured that it will use for all it's gitops source. To make this dynamic, lets define some variables in our `variables.tf` that we can use to configure this at runtime. We're going to add three new variables - one will be to pass in a GitHub Token and the other two will define the repo.

```tf
variable "github_token" {
  description = "GitHub token"
  sensitive   = true
  type        = string
  default     = ""
}

variable "github_org" {
  description = "GitHub organization"
  type        = string
  default     = "AverageMarcus"
}

variable "github_repository" {
  description = "GitHub repository"
  type        = string
  default     = "bootstrap-civo-cluster-blog-post-example"
}
```

Here you can see I've set default values that point to the example code repo for this blog post.

Now, lets go back to our Flux provider config and add the git config, using our variables:

```tf
provider "flux" {
  kubernetes = {
    host = civo_kubernetes_cluster.example.api_endpoint

    client_certificate = base64decode(
      yamldecode(civo_kubernetes_cluster.example.kubeconfig).users[0].user.client-certificate-data
    )
    client_key = base64decode(
      yamldecode(civo_kubernetes_cluster.example.kubeconfig).users[0].user.client-key-data
    )
    cluster_ca_certificate = base64decode(
      yamldecode(civo_kubernetes_cluster.example.kubeconfig).clusters[0].cluster.certificate-authority-data
    )
  }

  git = {
    url = "https://github.com/${var.github_org}/${var.github_repository}.git"
    http = {
      username = "git"
      password = var.github_token
    }
  }
}
```

Great! We're almost there! The last thing we need to set up Flux is define a [`flux_bootstrap_git`](https://registry.terraform.io/providers/fluxcd/flux/latest/docs/resources/bootstrap_git) resource. Back in our `main.tf` add the following to the bottom:

```tf
resource "flux_bootstrap_git" "example" {
  embedded_manifests = true

  # This is the path within our repo where Flux will watch by default
  path               = "flux"
}
```

Now, let's install Flux!

Before we do so, this is a good place to commit and push your latest changes before Flux adds files into your repo.

We're going to run apply again but this time we need to pass in our GitHub personal access token so that it has access to write to our repo.

```sh
tofu apply -var="github_token=${GITHUB_TOKEN}"
```

Once done you should see a new directory created in your repo on GitHub containing the flux files - `flux/flux-system`. Let's pull these down into our local copy before we continue - `git pull`.

## Confirming Our Cluster Is Setup

Now that we've got our Civo infrastructure created and Flux setup and installed I think it might be a good time to take a look in our cluster and confirm everything looks as we expect.

We can extract our cluster's KubeConfig by grabbing it from our outputs:

```sh
tofu output -raw kubernetes_kubeconfig > ~/.kube/civo-example.yaml
export KUBECONFIG=~/.kube/civo-example.yaml
```

With our new KubeConfig set, lets take a little look at our cluster, feel free to skip over this section if you are happy with your cluster running.

```sh
✨ kubectl get nodes
NAME                                                  STATUS   ROLES    AGE   VERSION
k3s-examplecluster-94d9-fc72b3-node-pool-910d-4znod   Ready    <none>   23m   v1.30.5+k3s1
k3s-examplecluster-94d9-fc72b3-node-pool-910d-esen4   Ready    <none>   23m   v1.30.5+k3s1

✨ kubectl get namespaces
NAME              STATUS   AGE
default           Active   24m
flux-system       Active   6m29s
kube-node-lease   Active   24m
kube-public       Active   24m
kube-system       Active   24m

✨ kubectl get gitrepo --all-namespaces
NAMESPACE     NAME          URL                                                                             AGE     READY   STATUS
flux-system   flux-system   https://github.com/AverageMarcus/bootstrap-civo-cluster-blog-post-example.git   6m57s   True    stored artifact for revision 'main@sha1:d1f3a4272b26ebc97b2698dd59dbbc4f462485fa'

✨ kubectl get kustomizations --all-namespaces
NAMESPACE     NAME          AGE     READY   STATUS
flux-system   flux-system   6m46s   True    Applied revision: main@sha1:d1f3a4272b26ebc97b2698dd59dbbc4f462485fa
```

## Installing Workloads

What's the point of having a cluster setup if we don't install anything on it? Finally, we're going to define some workloads in our git repo and have Flux automatically pick them up and install them into our cluster for us.

First thing we're going to do is define a new `Kustomization` that will point to our `apps` directory in our cluster. Create a new file at `flux/apps.yaml` with the following contents:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  interval: 5m0s
  path: ./apps
  prune: true
  sourceRef:
    kind: GitRepository
    name: flux-system
```

This will create a new Kustomization in our cluster that will use the already-existing `flux-system` GitRepository that is pointing to our GitHub repo.

Before we commit that, lets first add an application into our `/apps` directory for it to pick up. For our example, we're going to install [ingress-nginx](https://github.com/kubernetes/ingress-nginx) as a Helm chart. Create the file `apps/ingress-nginx.yaml` with the following:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: nginx
  namespace: default
spec:
  url: https://kubernetes.github.io/ingress-nginx
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: nginx
  namespace: default
spec:
  interval: 5m
  targetNamespace: kube-system
  chart:
    spec:
      chart: ingress-nginx
      version: "4.11.3"
      sourceRef:
        kind: HelmRepository
        name: nginx
        namespace: default
  values: {}
```

This will create two new resources in our cluster - a `HelmRepository` and a `HelmRelease`. These two together will install ingress-nginx into our cluster with the version `4.11.3` and the default values for the chart. If you want to provide any values, you can do so now.

Commit those changes and push them up to GitHub.

It may take a few minutes but eventually Flux will pick up the new resources and start processing them. You can watch for the changes with the following:

```sh
kubectl get kustomizations --all-namespaces --watch
```

Once the Kustomization is there and showing as ready we can then check for ingress-nginx being installed:

```sh
✨ kubectl get pods --namespace kube-system
NAME                                                          READY   STATUS    RESTARTS        AGE
civo-ccm-7967db4cfc-md7jg                                     1/1     Running   2 (6m49s ago)   38m
civo-csi-controller-0                                         4/4     Running   0               38m
civo-csi-node-b29h9                                           2/2     Running   0               38m
civo-csi-node-h9b8p                                           2/2     Running   0               38m
coredns-7b98449c4-t5zz4                                       1/1     Running   0               38m
kube-system-nginx-ingress-nginx-controller-7ff945b767-tc5fz   1/1     Running   0               72s
```

🎉

There's our app, managed by GitOps with Flux, running in our Civo cluster created as Infrastructure as Code with OpenTofu!

## Wrapping Up

We've now got a cluster setup that we can easily install and manage workloads via git. From here you can add more applications under the `apps` directory and they will be automatically picked up and processed by Flux.

Want to take things further?

* How about setting up [Renovate](https://docs.renovatebot.com/) to handle automatic version upgrades?
* Maybe you need more infra for your workloads - how about a [Database](https://registry.terraform.io/providers/civo/civo/latest/docs/resources/database) or an [Object Store](https://registry.terraform.io/providers/civo/civo/latest/docs/resources/object_store)?
* What about using [Remote State](https://opentofu.org/docs/language/state/remote/) and leveraging GitHub Actions to automatically apply changes in the `infra` directory?

These are out of scope for this post but if I get the time they may feature in a future post. 😉

Hopefully this is helpful for someone! I'd love to hear how you get on and any feedback you have, let me know on Mastodon at [@Marcus@k8s.social](https://k8s.social/@Marcus) or Bluesky at [@averagemarcus.bsky.social](https://bsky.app/profile/averagemarcus.bsky.social)!

---
layout: post.html
title:  "Restricting cluster-admin Permissions"
date:   2022-01-20
tags: Kubernetes Kyverno RBAC
summary: "Generally, and by default, operators of the cluster are assigned to the `cluster-admin` ClusterRole. This gives the user access and permission to do all operations on all resources in the cluster. There's very good reason for this, an admin generally needs to be able to setup and manage the cluster, including the ability to define and assign roles. But what if we need to _block_ an action performed by cluster admins? We can't do it with RBAC, it only allows for **adding** of permissions, not taking them away."
---

If you've managed multi-user / multi-tenant Kubernetes clusters then there's a good chance you've come across [RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) (Role-Based Access Control). RBAC provides a strong method of providing permissions to users, groups or service accounts withing a cluster. These permissions can either be cluster-wide, with `ClusterRole`, or namespace scoped, with `Role`. Roles can be combined together to build up all the rules stating what the associated entity is allowed to perform. These rules are additive, starting from a base of no permissions to do anything, building up what is allowed to be performed and there's no syntax to take away a permission that is granted by another rule.

Generally, and by default, operators of the cluster are assigned to the `cluster-admin` ClusterRole. This gives the user access and permission to do all operations on all resources in the cluster.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-admin
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
rules:
- apiGroups:
  - '*'
  resources:
  - '*'
  verbs:
  - '*'
- nonResourceURLs:
  - '*'
  verbs:
  - '*'
```

There's very good reason for this, an admin generally needs to be able to setup and manage the cluster, including the ability to define and assign roles. But what if we need to _block_ an action performed by cluster admins? We can't do it with RBAC, it only allows for **adding** of permissions, not taking them away.

Well, recently at [Giant Swarm](https://giantswarm.io/) we had an [issue in one of our CLIs](https://github.com/giantswarm/kubectl-gs/pull/632) used by cluster admins that incorrectly deleted more resources than intended. This was causing issues authenticating with the cluster and we needed to get a fix in place _fast_. The problem was we had no control over when people would update their CLI even once we'd released the fix. 

We couldn't hot-fix this by updating RBAC rules as we couldn't subtract the specific permission, but what we could do was leverage an [**admission controller**](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/) to block the request to the API.

At Giant Swarm we're pretty big users of [Kyverno](https://kyverno.io/) (which deploys an admission controller) and use it for a lot of validation and defaulting of resources in all our clusters. Not only can Kyverno validate and block based on a resource's values but it can also validate the _operation_ being performed, and by who. 

With this functionality available we were able to deploy a cluster policy that would block cluster-admin (and anyone else) from performing the specific delete all action that was causing us issues.

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: block-bulk-certconfigs-delete
  annotations:
    policies.kyverno.io/title: Block bulk certconfig deletes
    policies.kyverno.io/subject: CertConfigs
    policies.kyverno.io/description: >-
      A bug in an old kubectl-gs version causes all certconfigs to
      be deleted on performing a login, this policy blocks that
      action while still allowing the single delete.
spec:
  validationFailureAction: enforce
  background: false
  rules:
  - name: block-bulk-certconfigs-delete
    match:
      any:
      - resources:
          kinds:
          - CertConfig
    preconditions:
      any:
      - key: "{{request.name}}"
        operator: Equals
        value: ""
    validate:
      message: "Your current kubectl-gs version contains a critical bug, please update to the latest version using `kubectl gs selfupdate`"
      deny:
        conditions:
        - key: "{{request.operation}}"
          operator: In
          value:
          - DELETE
```

There's a few things going on here so I'm going to explain each bit individually.

First up we specify the Kind of resource we want this policy to apply to, in our case that's `CertConfig` but it can be anything within the cluster. It's also possible to target specific groups and API versions if needed.

```yaml
match:
    any:
    - resources:
        kinds:
        - CertConfig
```

Next up we're setting a precondition that allows us to do some filtering based on the details of the request. In this instance we're only interested in requests that don't have a name specified (this is the case when operating on a list of resources rather than a single resource) which allows us to target only those "delete all" requests.

```yaml
preconditions:
    any:
    - key: "{{request.name}}"
    operator: Equals
    value: ""
```

Finally we have the actual validation rule. We're specifying a `deny` rule that'll block requests (matching the previous `match` and `preconditions`) with the `DELETE` operation. We're also able to define a message that'll be returned to the client as the reason for why the admission controller rejected the request. We're using this to inform users about the bug and encouraging them to upgrade.

```yaml
validate:
    message: "Your current kubectl-gs version contains a critical bug, please update to the latest version using `kubectl gs selfupdate`"
    deny:
    conditions:
    - key: "{{request.operation}}"
        operator: In
        value:
        - DELETE
```

With this single policy deployed to our clusters we've been able to block the bug in our CLI, even when the user performing the action has cluster-admin level permissions.

## Other Use Cases

While we needed this to work around a bug in our client there are other situations where this approach could be useful.
* A policy that prevents deletion of any resource that has a `do-not-delete: "true"` annotation on it to prevent accidental deletion of critical resources (such as persisten volumes or secrets).
* A policy that prevents fetching the details of secrets in a specific namespace while still allowing in every other namespace (including those that may not yet exist).
* A policy that blocks deletes, updates or patches from everyone except a specific user that can be used to prevent others "cleaning up" resources that you may be trying to debug.

So, if you haven't already, I recommend taking a look at [Kyverno](https://kyverno.io) and especially taking a look at the [example Policies](https://kyverno.io/policies/) that they have for an idea of what can be done.
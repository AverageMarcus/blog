---
layout: post.html
date:  2025-02-02
title: Posting to LinkedIn via the API
tags: API LinkedIn SocialMedia
summary: |
  I have a habit of automating as much of my life as I can. As part of that I have some small automations that handle posting to social media automatically when I publish a new blog post. (More on this in a future post). In the past this was Twitter but that is dead so these days I post to my Mastodon and Bluesky accounts automatically whenever a new blog post is available on my website. Maybe that's how you ended up here today! One platform I had been avoiding for a long time was LinkedIn. I had the impression that they didn't have a free, personal API available for users to use to post status updates. Well, turns out I was mistaken and it's actually not _too_ difficult to setup, there's just a LOT of outdated information out there. So lets fix this...

---

I have a habit of automating as much of my life as I can. As part of that I have some small automations that handle posting to social media automatically when I publish a new blog post. (More on this in a future post). In the past this was Twitter but that is dead so these days I post to my Mastodon and Bluesky accounts automatically whenever a new blog post is available on my website. Maybe that's how you ended up here today! One platform I had been avoiding for a long time was LinkedIn. I had the impression that they didn't have a free, personal API available for users to use to post status updates. Well, turns out I was mistaken and it's actually not _too_ difficult to setup, there's just a LOT of outdated information out there. So lets fix this...

## Creating a new App

I'm going to assume you already have a LinkedIn account, if not you will need to create one or this whole process is pretty pointless. 😅 Once logged in, head over to [`https://www.linkedin.com/developers/apps/new`](https://www.linkedin.com/developers/apps/new) and fill out the details.

> Note: For this you require a "company page" that the app will be associated with. You can [create one](https://www.linkedin.com/company/setup/new) easily enough that can just be used as a placeholder for the app.

Once your app is created the first thing you'll need to do is head to the "Settings" tab and follow the process to verify your app. Not sure why this isn't part of the app creation flow but whatever. 🤷

With your app verified you now need to enable the "products" you'll be using so switch to the Products tab. For sharing posts to our LinkedIn profile we're going to need to enable the following:

* Share on LinkedIn
* Sign In with LinkedIn using OpenID Connect

Finally, switch over to the "Auth" tab and scroll down to the "OAuth 2.0 scopes" section, you should hopefully be seeing something similar to the following:

<figure class="center" markdown="1">

![A screenshot of the OAuth 2.0 scopes section showing the following scopes listed: openid, profile, w_member_social and email](/images/linkedin-scopes.png)

<figcaption>Expected LinkedIn app scopes</figcaption>
</figure>

## Creating an Access Token

Now that we have an app created we need to generate a new access token to use when making API calls. Thankfully, this is now very simple as LinkedIn provide a tool to generate a token whereas previously users were required to run a server to handle callbacks, etc.

Navigate to [`https://www.linkedin.com/developers/tools/oauth/token-generator`](https://www.linkedin.com/developers/tools/oauth/token-generator), select your app from the dropdown, check all the scopes available and click the "Request access token" button.

You will likely need to login again here but once done you should be presented with an access token that will expire in 2 months.

Keep this safe and DO NOT SHARE IT.

## Using the API

Now that we have an access token we can finally make calls to the API!

First, lets get our own user profile details as we're going to need our [URN](https://www.ietf.org/rfc/rfc2141.txt) to use when posting status updated.

```shell
curl --silent -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "https://api.linkedin.com/v2/userinfo"

{
    "sub": "XXXXXXX",
    "email_verified": true,
    "name": "☁️Marcus Noble",
    "locale": {
        "country": "US",
        "language": "en"
    },
    "given_name": "☁️Marcus",
    "family_name": "Noble",
    "email": "",
    "picture": ""
}
```

Replace the `${ACCES_TOKEN}` with your newly generated token. The response you get back should look similar to the above JSON but obviously with your LinkedIn details. Make a note of the `sub` value as we'll be using this next.

To post a status update to your profile:

```shell
ACCESS_TOKEN="xxx"
URN="xxx"
POST_BODY="This is a test post"

curl -X POST \
  -H "LinkedIn-Version: 202210" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -H "Authorization:  Bearer ${ACCESS_TOKEN}" \
  --data '{"author": "urn:li:person:'${URN}'","lifecycleState": "PUBLISHED","specificContent": {"com.linkedin.ugc.ShareContent": {"shareCommentary": {"text": "'${POST_BODY}'"},"shareMediaCategory": "NONE"}},"visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}}' \
  "https://api.linkedin.com/v2/ugcPosts"
```

Fill in the environment variables with your appropriate values and run the curl command to post a new status update to your profile.

> Note: If you include any `"` in your post body you will need to escape them or it will cause the JSON to be invalid.

For full details on what is available when sharing to LinkedIn check out the [official documentation](https://learn.microsoft.com/en-gb/linkedin/consumer/integrations/self-serve/share-on-linkedin).

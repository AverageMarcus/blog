---
layout: post.html
title:  "Hackathonarama 2: The spirit of the hack"
date:   2016-10-25
tags: hackathon
summary: "This past weekend I have attended [Hackference](https://twitter.com/hackferencebrum) for the second year running. Just like [last year](/2015-10-06-hackathonarama/) it was a 1 day conference followed by a 24 hour hackathon, and just like last year I've learnt a lot I'd like to share."
---

This past weekend I have attended [Hackference](https://twitter.com/hackferencebrum) for the second year running. Just like [last year](/2015-10-06-hackathonarama/) it was a 1 day conference followed by a 24 hour hackathon, and just like last year I've learnt a lot I'd like to share.

{{> tweet id='789372106907717632' }}

The conference was an amazing mix of topics with [plenty of fun](https://twitter.com/Marcus_Noble_/status/789448940966010880) added in. There was a lot of great speakers talking about [bluetooth in the browser](https://twitter.com/Marcus_Noble_/status/789405754318987264), a [new browser](http://servo.org/), [how everything is pretty much going to blow up in our faces](https://twitter.com/JFKingsley/status/790229550076661761) and [something that looks very complex](https://twitter.com/CalEuanHopkins/status/789415734313033728). The day was finished off with an increadible talk from [Remy](https://twitter.com/rem) talking about working on the web, why you don't need to get JavaScript fatigue and lots of inspiring stuff.

{{> tweet id='789488036002271233' }}

The afterparty, Chillference, was a really good way to chat with lots of people and just relax after a long day. There was drinks, food and boardgames to keep everyone in high spirits as well as a [DJ set done on two GBAs](https://twitter.com/hackferencebrum/status/789540149839400960)!!!

{{> tweet id='789565552662548482' }}

Last year I [posted some tips](/2015-10-06-hackathonarama/) on surviving an all-night hackathon. I still stand by these tips and encourage people to read them if they plan to attend such an event. This year I went in to it much more prepared. I knew what to expect this time, I had an idea of what my limits would be, I actually had some ideas and I wasn't alone. Going along with someone ([Dan](https://twitter.com/danielthepope) :wave:) made things _much_ less daunting than last year.

{{> picture alt="Hackference 2016" caption="Everyone ready to hack" url="/images/hackference2016.jpg" }}

Even though I had some idea of what I wanted to do I started out hacking at something else to start with. Initially I planned to create an app that would be able to determine the reading age of a user's tweets. This turned out to not be so feasible, mainly due to the brevity of tweets. Instead I made use of the [sentiment analysis API](https://westus.dev.cognitive.microsoft.com/docs/services/TextAnalytics.V2.0/operations/56f30ceeeda5650db055a3c9), part of Microsoft's [Cognitive Services](https://www.microsoft.com/cognitive-services). This ended up being pretty fun and surprisingly simple. All you need to do is send it some text and it'll return a value between 0 and 1 indicating what it belives the sentiment of the text is. I used this to take a look at the current political hopefuls in the US, [Donald](http://tweetanalysis.marcusnoble.co.uk/user/realDonaldTrump) and [Hillary](http://tweetanalysis.marcusnoble.co.uk/user/hillaryclinton), both who (at time of writing) see pretty positive. It'll be interesting to see how that changes after the election. Take a look for yourself: [Tweet Analysis](http://tweetanalysis.marcusnoble.co.uk/) ([Code](https://github.com/AverageMarcus/TweetAnalysis))

{{> tweet id='790093114857971712' }}

My next two hacks involved using the [emotion API](https://www.microsoft.com/cognitive-services/en-us/emotion-api) from Microsoft's [Cognitive Services](https://www.microsoft.com/cognitive-services) to analyse photos taken by the webcam. The first hack, [CommitEmotion](https://github.com/AverageMarcus/CommitEmotion), is a Git hook that will take a photo with the webcam upon creating a commit. It will then send it to the emotion API for analysis and determine the main emotion being shown. This will then be prepended to the commit message in the form of an emoji. I had hoped to see this be more colourful and random but it seems [I have a pretty neutral face when writing commit messages](https://github.com/AverageMarcus/CommitEmotion/commits/master). I also remixed this hack into another hack, [CheerUp](https://github.com/AverageMarcus/CheerUp), that runs in the background and snaps a webcam photo every five minutes. If it detects that you are sad or angry it'll open up a random [/r/aww](https://www.reddit.com/r/aww/) page to cheer you up.

Finally I went back to my original idea of creating a [crowd sourced tech support](https://github.com/AverageMarcus/CrowdSupport) line using [Nexmo](https://www.nexmo.com/). The idea behind this was that people could ring up a number to register themselves as an expert in a perticular topic then later other people could ring up to ask a question and get put through to one of these experts. This used Nexmo's [Voice API](https://www.nexmo.com/products/voice/) to respond to calls and then perform the connection between two numbers. I didn't end up taking this idea too far as there was a few features I needed that are not yet available from Nexmo (such as having to wait until the robot has finished taking before being able to press a digit or the ability to connect a call after first playing a message to the joining party). All this was fed back to [Phil](https://twitter.com/leggetter) so hopefully these will come in the future.

{{> tweet id='790186086672822272' }}

When it came to everyone demoing their hacks, and there was a lot, I was blown away by some of the cool things people were able to make. Everything from [calling up to find your next train](https://twitter.com/hackferencebrum/status/790176783987576833) to the ability to [lookup actors in a Netflix video by clicking them](https://twitter.com/hackferencebrum/status/790166819059462145) to [programmable DJing](https://twitter.com/hackferencebrum/status/790175003555815424) and even a [hackable dress](https://twitter.com/hackferencebrum/status/790196227702947840)!!!

All in all it was such an amazing event with so much praise going out to [Mike](https://twitter.com/ukmadlz) and everyone involved in making it happen. I even managed to win a prize from Nexmo for all the feedback I gave them! :grin:

{{> tweet id='790208141497602048'}}

If you missed out or want to re-live the event then you're in luck. I also threw together a small site where you can jump in to some moments from the weekend. Enjoy! [http://hackference360.marcusnoble.co.uk](http://hackference360.marcusnoble.co.uk)

See you all at the next last Hackference!
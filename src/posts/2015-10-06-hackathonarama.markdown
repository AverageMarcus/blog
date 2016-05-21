---
layout: post.html
title:  "Hackathonarama"
date:   2015-10-06
tags: hackathon
summary: "This past weekend I attended my first proper 2-day hackathon. While I didn't manage to build anything awesome I did learn *a lot* about some new technologies and how to approach hackathons, especially when it's your first time."
---

Last weekend I attended my first real 2-day hackathon - [Hackference](http://2015.hackference.co.uk/) (a 1 day conference and 2 day hackathon) - not really knowing what I was doing going in. Unfortunately I didn't manage to build anything cool (more on that below) but I did learn a lot about hackathons and about my fellow developers. Here are my tips for going to your first hackathon (in no relevant order):

### 1. Drink water

This should really be a tip for life but I really made this mistake on the first day. I went equipped with cans of Relentless, bottles of Mt. Dew and other things that will do crazy things to my body. While these do give you a short-term boost in energy, the come-down can be hard and will eventually leave you dehydrated. A better tactic is to drink water for the most part and if you find yourself in need of a boost then have an energy drink sparingly. This will also help prevent the headaches kicking in on the second day.

### 2. Bring a friend (or make friends there)

I went along alone, which usually is fine (I love my own company) but, being the anti-social type that I am, I ended up working alone rather than in a team. This was by far my biggest mistake. I totally missed out on a great learning experience by working with others. If you can't get anyone to go along with you, find someone there that is working on something that interests you and ask to join them.

### 3. Don't waste too much time on a technology/library/API/etc.

On the first day you will likely have sponsors telling you about some of their resources that you can make use of. This is really cool as if you get stuck with any of them you can go right to the source for help. But the idea of the event is to build and learn. If you end up sinking many of the crucial hours trying to get a library to work you aren't going to get a project finished. This is where I went wrong. I tried to make use a Microsoft's [Face API](https://gallery.cortanaanalytics.com/MachineLearningAPI/b0b2598aa46c4f44a08af8891e415cc7) but unfortunately is was having problems.

{{> picture alt="No Face API for you :cry:" caption="No Face API for you :cry:" url="/images/AzurePortalError.png" }}

The two there from Microsoft, [Martin](https://twitter.com/MartinKearn) & [Martin](https://twitter.com/thebeebs/), did manage to generate me an API key on the second day but by then it was too late for me to do anything useful with it.

I then moved on to trying out [Twilio's](https://www.twilio.com/) WebRTC Video. I was going to build a super-simple video chat room between two people. The code required to get it set up is incredibly simple, Twilio have done a great job with the SDK. I loaded it up on my laptop, then on my Android phone. The laptop worked great... the phone didn't work. *Ugh!* After some researching I eventually came across a [blog post](http://www.broken-links.com/2010/07/08/making-html5-video-work-on-android-phones/) by [Peter Gasston](http://www.broken-links.com/2010/07/08/making-html5-video-work-on-android-phones/) that explains a problem on Android where the `.play()` method needs to be manually called to get mp4 videos to play. After adding this to my code (at the end of the second day) all worked perfectly. Throughout all this I was talking with [Rob](https://twitter.com/dN0t) from Twilio about it (who contacted the lead engineer about the issue) so when I had a solution I made sure he was aware so it could be baked back into the Twilio SDK. *How cool is that!?*

### 4. Have some ideas ready

I went in with nothing. No clue what I was going to do. Even after seeing the sponsors demo's I was still lacking a bright idea. If you can, look up the sponsors in advance, look at what they have on offer and come up with 2-3 ideas of how you could use their resources for something cool. Even if you don't act on them you wont be in the position I was of spending the first hour or two just trying to come up with an idea of what to do.

### 5. Talk to people

This was the best thing I did. I went round and talked to people, asked them what they were doing, how they were doing it, etc. The whole point of being there is to learn so don't waste the most useful resource available - other peoples experiences.

### 6. Sleep

I had planned to power through the night, which I did do, but I got to a point where I wasn't able to think of anything new or do anything creative. My brain was just too tired. I had tried to get some rest (take a sleeping bag and pillow) but it was too noisy at the time. With hindsight, some ear plugs would have been **very** useful.

### 7. Make sure you know how to use a projector

{{> picture url="/images/HackathonProjector.jpg" caption="How many developers does it take to hook up a projector?" alt="How many developers does it take to hook up a projector?" }}

### 8. HAVE FUN!

This should be your main focus. If you're not having fun, why are you even there? Don't beat yourself up if you fail to produce something but be happy with trying and learning new things.

---

I want to say thank you to everyone involved in organising and running Hackference and for everyone who attended and made me feel so welcome. I also want to thank [Pusher](http://www.pusher.com/) as I won the ticket to go from them (I :heart: Pusher). A big shout out to [Rob Spectre](https://twitter.com/dN0t) for his *AMAZING* [keynote talk](https://github.com/RobSpectre/Talks/tree/master/With%20Great%20Power) (Developers are superheroes? You bet they are!) and for continuously putting up with me finding problems with the Twilio WebRTC SDK and trying to help me overcome them, and for just being a cool guy who likes comics!
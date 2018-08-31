---
layout: post.html
title:  "Recording talks at JSOxford meetups"
date:   2018-09-01
tags: Meetup
summary: "I've been asked a few times recently about how we record the talks at [JSOxford](https://jsoxford.com) and what equipment we use. I thought it best to write up our process so others can also learn from it."
---

I've been asked a few times recently about how we record the talks at [JSOxford](https://jsoxford.com) and what equipment we use. I thought it best to write up our process so others can also learn from it.

<figure class="center" markdown="1">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/UXupD_4uM6g" frameborder="0" allow="encrypted-media" allowfullscreen></iframe>
  <figcaption>Example Video: Jo Franchetti - Intersection Observers</figcaption>
</figure>

Recording the talks of JSOxford is something we wanted to do from when we took over at the start of this year. We always felt it was useful to be able to re-watch a talk and refresh your memory after the event. We took a lot of inspiration from an excellent post by [Adam Butler](https://twitter.com/labfoo) where he talks about the [Meetup & Conference video equipment](https://lab.io/articles/2016/04/09/video-equipment/) he used to record the [Bristol JS](http://www.meetup.com/BristolJS/) talks.

There's been a few attempts to record JSOxford in the past from attempting to live stream it to having [Pusher](https://pusher.com/) come in and record it as part of their [Sessions](https://pusher.com/sessions). We wanted to have more control over the process and have something that the speakers could also use to show off their talk.

# The Equipment

Lets start off with a shopping list of what we use and then explain how it all fits together.

| Item | Quantity | Price |
| :--- | :------: | ----: |
| [Zoom Q2n/UK Handy Video Recorder](https://www.amazon.co.uk/Zoom-Q2n-Handy-Video-Recorder/dp/B01N454CI0/) | 1 | £136 |
| [AVerMedia Live Gamer Portable](https://www.amazon.co.uk/AVerMedia-Live-Gamer-Portable-LGP/dp/B00B2IZ3B0/) | 1 | £129.90 |
| [HDMI Splitter](https://www.amazon.co.uk/Switch-iSolem-Splitter-Input-Output/dp/B006KZBC92) | 1 | £11.99 |
| [Betron HDMI Switch](https://www.amazon.co.uk/Betron-HDMI-Switch-Switcher-Connectors-Black/dp/B00KCPY5Y0/) | 1 | £9.95 |
| HDMI Cables - [small](https://www.amazon.co.uk/dp/B00DNSP6XC/) & [large](https://www.amazon.co.uk/gp/product/B01H7M782G/) | 2 small 3 large | £15.23 |
| [Tripod](https://www.amazon.co.uk/AmazonBasics-60-Inch-Lightweight-Tripod-Bag/dp/B005KP473Q/) | 1 | £20 |
| [Power Strips with USB ports](https://www.amazon.co.uk/Outlets-Protection-Universal-Extension-Shutter-Black-Gray/dp/B01MTS5JJ4/) | 1 | £15.99 |
| [64Gb Micro SD Card](https://www.amazon.co.uk/SanDisk-microSDXC-Memory-Adapter-Performance/dp/B073JYVKNX) | 1 | £14.99 |
| [128Gb Micro SD Card](https://www.amazon.co.uk/SanDisk-microSDXC-Memory-Adapter-Performance/dp/B073JYC4XM) | 1 | £29.15 |
| [CyberLink PowerDirector 15 Ultra](https://www.amazon.co.uk/CyberLink-PowerDirector-15-Ultra-Editors/dp/B01M3T8V5F) | 1 | £40.85 |
| | **Total** | **£424.05** |

_Prices valid at time of writing_

Optional:
* Adapters - Mini Display port, USBC, VGA, whatever you can get.
* [Wireless USB Presentation Clicker](https://www.amazon.co.uk/dp/B000FPGP4U)
* Portable hard drive to store everything on long-term

# How we record the talks

When recording a talk at JSOxford we actually produce two videos for each talk.

The first video comes from the Zoom Q2n camera that we have pointed at the speaker. This is useful for getting any body language used during a talk, such as pointing at something on the projector. We also use this to capture the audio as the Zoom Q2n has a very nice microphone designed for musicians which picks up our speakers nicely (just remember to turn the volume up when recording otherwise be ready for a lot of post-processing volume boosting). As our venue has a microphone / speaker setup we position the camera close to the speaker to get the best sound quality. We record this at 720p as we found the camera had some trouble writing to the SD card we were using when set to 1080p.

The second video is captured by the "AVerMedia Live Gamer Portable" capture card. This grabs a video of the output from the speakers laptop as it's being sent to the projector / TV. This makes the actual presentation much clearer and allows speakers to be able to do live-coding, show off demos, etc., and still have it captured clearly.

Some laptops (Macs mainly) have a form of DRM that can prevent the capture card from being able to record, to get around this we use the HDMI splitter in between the laptop and the capture card. This strips off the DRM before sending it on to the capture card. We don't actually use the second output.

From the capture card we then output to the HDMI switch that then outputs directly to the projector / TV. We have a second laptop connected to this switch so we can use it for intro presentations, etc., and switch over to the speakers laptop with the press of a button.

# How things connect together

{{> picture url="/images/AVSetup.png" alt="Picture of how AV equipment connects together" }}

# Post processing

With the event over it's now time to stitch the videos together and clean them up. We use CyberLink PowerDirector to trim the videos to the desired length and sync up the two videos. This is mostly done by eye, watching for slide transitions on both videos. We lay the video of the speaker over the top of the screen capture as a small box in the lower right corner. We add a few static images as an intro to the video with the JSOxford logo and our sponsors. I highly recommend spending some time testing out the various features and figuring out what works best for you. Once you have something you like, save it as a project and re-use it in the future by swapping out the videos used.

With a final video of the talk produced it's time to distribute it. We upload our videos onto [YouTube](https://www.youtube.com/channel/UCjXR8G5M-iwkHVF26AFFsCQ) initially as unlisted and share them with the speaker to make sure they are happy with the end result. We also make use of YouTubes auto-generated subtitles - but be warned, these struggle with technical terms and we usually spend at least a couple hours per video going through the generated subtitles and correcting them. This is by far the most time consuming part (once you've got the hang of the video editing) but is very much worth it for your viewers.

# Other things we tried

It took us a little while to get to the stage we're at now, and I'm sure there's still plenty more we an improve on. I thought it best to point out some things that didn't go too well for us so other people can hopefully avoid them.

When we first started looking into recording the speakers we first tried our a couple microphones to capture the speakers voice - the first a "Britney" style mic and then a TV reporter style. Both were cheap and didn't work well at all. If you have the money to invest in a good quality wireless microphone it'll surely help but we were satisfied with what we got out of the camera.

As mentioned briefly above, the camera took a little while to get used to. First we struggled to actually have it record for longer than a few seconds due to the SD card not being fast enough. Dropping the quality down to 720p from 1080p solved this without any noticeable effect on the final result. The second issue we hit was the volume control on the camera is really easy to catch. I ended up doing a whole recording with it on the lowest volume and had to amplify the audio in post-processing quite a lot to make the audio usable.

We tried various different ways of wiring up the bits of kit together before we eventually settled with what is shown above. It was the only way we could reliably get a recording without it flickering at times or just not working.

The final thing isn't really related to any of the above but a good bit of advice. When using a projector it's best to disable any power saving functions before your event begins as this can be really annoying during switch over of laptops when the projector things it's ok to turn off and then takes a couple minutes to turn back on again.

---

If anyone has any more tips, experiences they'd like to share or just want to know more please reach out to me at [@Marcus_Noble_](https://twitter.com/Marcus_Noble_) or at [@JSOxford](https://twitter.com/JSOxford).

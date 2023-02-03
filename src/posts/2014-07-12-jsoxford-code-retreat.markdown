---
layout: post.html
title:  "JSOxford Code Retreat - or how to use an Apple keyboard"
date:   2014-07-12
tags: JavaScript
summary: "Last Sunday I went to a Code Retreat hosted by [JSOxford](http://jsoxford.com/). This was a full day event of coding, split into four sections all based around [Conway's Game of Life](http://en.wikipedia.org/wiki/Conway's_Game_of_Life)."

---

Last Sunday I went to a Code Retreat hosted by [JSOxford](http://jsoxford.com/). This was a full day event of coding, split into four sections all based around [Conway's Game of Life](http://en.wikipedia.org/wiki/Conway's_Game_of_Life).

[![](/images/tweets/485697274174275584.svg)](https://twitter.com/tweet/status/485697274174275584)

For those not familiar with Conway's Game Of Life I will be doing another blog post on it shortly. But simply put it is a basic computer model of life.

For the whole day we focused on perfecting code rather than finishing. We didn't care if we had anything that worked or not, the idea was to practice different forms of programming. (*We were even told to delete all our code after each round*)

## Round One - Paper

The first round was aimed at getting us familiar with the task at hand. We paired up, as we did with most of the rounds, and tasked with writing out the code we thought would make up the game on pieces of paper. I had paired up with [Dan Pope](https://twitter.com/danielthepope) and we set to work on the writing out our code, *sans-highlighting*.

[![](/images/tweets/485722324604579840.svg)](https://twitter.com/tweet/status/485722324604579840)

Dan focused on a method that calculates the number of neighbours a given cell has while I focused on the main game loop. The absence of an <abbr title="Integrated development environment">IDE</abbr> is a terrible thing so our code was pseudo-JavaScript/pseudo-Python. We had plenty of time to write out the whole game with a bit of time left at the end to go through and fix a couple of potential bugs!

## Round two - TDD/BDD

The next round was in more familiar territory. The rules stated we must first write a test to verify some of the game logic, then the other person must write the minimal amount of code to make that test pass. In the most haphazardly way possible.

For example:

<pre><code class="javascript">
// Test
describe('Calculator', function(){
  describe('sum', function(){
    it('should return 2', function(){
      (calculator().sum(1,1)).should.eql(2);
    })
  })
})

//Code
function calculator(){
	function sum(n1, n2){
		return 2;
	}

	return { sum : sum }
}
</code></pre>

As you can see, the code doesn't actually work as expected, it just does enough to make the tests pass. I don't know how often this sort of thing actually happens in the 'real world', I know we sure don't do this. :sweat_smile:

## Lunch

[![](/images/tweets/485758298755698688.svg)](https://twitter.com/tweet/status/485758298755698688)

Not the best lunch in the world but a free lunch is a free lunch.

## Round three - Randori

The word 'Randori' comes from the martial art Aikido and means many people attacking the same person. In the world of programming this lends itself towards paired programming, but with more partners.

[![](/images/tweets/485774627139223552.svg)](https://twitter.com/tweet/status/485774627139223552)

Think one laptop, with one person on the keys, and a group of people gathered around telling them what to code. The person typing had no decision over what to write, their partner is the one "driving" with help from the others stood around. This is taken in turns, swapping every 5 minutes.

Having 8 people trying to decide what to code, without any prior spec or discussion went about as well as you'd expect. The code jumped around a bit and we had to backtrack at some point but the biggest challenged we faced was getting to grips with a MacBook keyboard. Who knew that they didn't have all the keys needed?

<figure class="center" markdown="1">

![MacBook symbol]({{ site.url }}/images/macbook-alt-symbol.PNG)

<figcaption>WTF is this supposed to be?</figcaption>
</figure>

## Round four - Immutables

Task four saw us trying to build the game using only immutable variables. This was **hard**.

I tried to solve this using maps, filters, cloning etc. but I ended up running out of time before I had a fully working solution. I did manage to have cells die, just couldn't generate new ones.

## Roundup

All in all it was a really good day that gave me a chance to flex a bit of JavaScript outside of the browser. If nothing else, it has made me very excited for the upcoming [NodeBots](https://www.eventbrite.co.uk/e/nodebots-summer-of-hacks-tickets-11906664153) event.

I hope to put together a fully working version of Conway's Game of Life shortly and will put together another post about it.

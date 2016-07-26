---
layout: post.html
title:  "Building a Pokémon Go clone"
date:   2016-07-26
tags:
summary: "Last Saturday was [@JSOxford](https://twitter.com/jsoxford)'s second [Summer of Hacks 2016](http://summerofhacks.io/) event - [Game Dev Day](http://gamedevday.club/).
The whole day was amazing. There was a great turnout and everyone seemed to really enjoy it. [Many great things were built](https://github.com/omgmog/gdd-2016)!

My plan for the day? To make a [Pokémon Go](http://www.pokemongo.com/) clone using web technologies!"
---

Last Saturday was [@JSOxford](https://twitter.com/jsoxford)'s second [Summer of Hacks 2016](http://summerofhacks.io/) event - [Game Dev Day](http://gamedevday.club/).
The whole day was amazing. There was a great turnout and everyone seemed to really enjoy it. [Many great things were built](https://github.com/omgmog/gdd-2016)!

My plan for the day? To make a [Pokémon Go](http://www.pokemongo.com/) clone using web technologies!

{{> picture alt="Pushermon Go" url="/images/pushermon-go.jpg" }}

_⚠️ Warning: I used a fair amount of ES6 features while builing this so it's likely it'll only work in modern browsers (possibly only Chrome as that's what I used)._

The game is built using [Mapbox](https://www.mapbox.com/) for the maps, [Pokéapi](https://pokeapi.co/) for the Pokémon data and sprites and [Pusher](https://pusher.com/) to handle sending out the locations to all players.

I settled on using Mapbox for the maps as it had a pretty nice [JavaScript library](https://www.mapbox.com/mapbox-gl-js/) and was the first that I found out how to prevent manual movement of the map. As with the original Pokémon Go I wanted to make it so that players actually had to move around so manual movement of the map was blocked and the zoom level was limited. Rotation of the map is still allowed though.

{{> picture alt="Mapbox" caption="It's quiet round here" url="/images/pushermon-map.png" }}

Using [Mapbox GL](https://www.mapbox.com/mapbox-gl-js/) I was able to easily add sprites to the map using an image and some coordinates:

```js
var marker = new mapboxgl.Marker(createSprite(data))
                    .setLngLat(data.coordinates)
                    .addTo(map);
```

{{> picture alt="Modal attack window" caption="Needs some more polish" class="right" url="/images/PushermonGoBattle.gif" }}

This then created an image overlaying the map that I could attach an event handler to in order to trigger a modal window to start the "fight".

```js
const modal = document.getElementById('modal');
document.querySelector('body').addEventListener('click', show);

function show(event) {
  if(event.target.classList.contains('pokemon')) {
    currentSprite = event.target;
    currentSprite.dataset.currenthp = currentSprite.dataset.hp;

    modal.querySelector('.modal-image').src = event.target.src;
    modal.querySelector('.modal-name').innerHTML = event.target.dataset.name;
    modal.querySelector('.modal-current-hp').style.width = '100%';
    modal.querySelector('.modal-current-hp').style.backgroundColor = '#39e239';
    modal.querySelector('.modal-attack').innerText = 'ATTACK!!!';
    modal.querySelector('.types').innerText = currentSprite.dataset.types;
    modal.classList.remove('hide');
  }
}
```

Rather than copying the capture mechanic from Pokémon Go I wanted to implement some way of battling with the monsters encountered. I settled on having a large "attack" box that needs to be repeatedly tapped to bring down their HP.

## Location

Just like with the original Pokémon Go, I wanted all players to see the same Pokémon in the same location. Pusher was great for this! I could use it to send the same events to all players. The one problem I did have was I didn't want to flood every player with every single encounter in the world all the time. For the purpose of the hackday I limited the location encounters were generated to be within the area we were working but I've now been able to improve on that thanks to a suggestion from [Ben](https://twitter.com/benjaminbenben): [Geohash](https://en.wikipedia.org/wiki/Geohash)!

In simple terms, geohash take some coordinates and terms them into a unique code. For example: The geohash for Big Ben is [gcpuvpm](http://geohash.gofreerange.com/gcpuvpm). The longer the code, the more precise it is (more zoomed in). While exploring this idea I came across a great website that allows you to [explore geohash codes on a map](http://geohash.gofreerange.com/).

When players joined the game, or moved about, I had their browser calculate all geohashes that their visible map contained. I then used these hashes as Pusher channel IDs to subscribe to.

```
let currentGeoHashes = [];
let mapBounds = map.getBounds(); // Get the bounds of the visible map
let geoHashes = ngeohash.bboxes(mapBounds._sw.lat, mapBounds._sw.lng, mapBounds._ne.lat, mapBounds._ne.lng, 6); // Get all geohashes within the bounds
currentGeoHashes.forEach(geohash => {
  if(!geoHashes.includes(geohash)) {
    // Unsubscribe from any hash we've moved out of
    pusher.unsubscribe(geohash);
  }
});
// Keep a record of geohashes we're currently in
currentGeoHashes = currentGeoHashes.filter(geohash => geoHashes.includes(geohash));
geoHashes.forEach(geohash => {
  if(!currentGeoHashes.includes(geohash)) {
    // Subscribe to any new hashes we've moved into
    currentGeoHashes.push(geohash);
    pusher.subscribe(geohash).bind('encounter', encounter);
  }
});
```

With this done, players now only receive encounter events that are within their geohash 'slices' (this may still be beyond the visible map). The server can randomly generate an encounter and then send the event to just the channel it is relevant to.

```js
function nextEncounter() {
  const channelArray = Array.from(channels);
  const bounds = channelArray[Math.floor(Math.random()*channelArray.length)];
  if(bounds) {
    const boundingBox = ngeohash.decode_bbox(bounds);
    const lngMin = boundingBox[1];
    const lngMax = boundingBox[3];
    const latMin = boundingBox[0];
    const latMax = boundingBox[2];

    const lng = utils.randomNumber(lngMin, lngMax).toFixed(10);
    const lat = utils.randomNumber(latMin, latMax).toFixed(10);
    const duration = utils.randomNumber(30, 300) * 1000;

    const pokemonId = parseInt(utils.randomNumber(1, 250), 10);

    fetch(`http://pokeapi.co/api/v2/pokemon/${pokemonId}/`)
      .then(res => {
        return res.json();
      })
      .then(pokemon => {
        const data = {
          id: pokemonId,
          name: pokemon.name,
          sprite: `https://pokeapi.co/media/sprites/pokemon/${pokemonId}.png`,
          coordinates: [lng, lat],
          expires: parseInt((new Date()).getTime() + duration, 10),
          hp: pokemon.stats.find(stat => stat.stat.name === 'hp').base_stat,
          types: pokemon.types.map(type => type.type.name[0] + type.type.name.substring(1))
        }

        pusher.trigger(bounds, 'encounter', data);
      });
  }
  setTimeout(nextEncounter, 5000);
}
```

You may have noticed above that I am randomly getting the bounds of an encounter from a `channels` object. This is used to store all channels that currently have players subscribed to it - there's no point sending out events if no one is listening. Pusher has the ability to set up [webhooks](https://pusher.com/docs/webhooks) that allow you to be notified of new channel subscription and unsubscription. I actually struggled a bit with these at first as the documentation on using the `pusher.webhook()` method in Node.js was very hard to find ([it's here](https://github.com/pusher/pusher-http-node#webhooks-1)). Once I figured it out it was actually pretty simple:

```js
// List of channels that have users subscribed to
let channels = new Set();


server.route({
  method: 'POST',
  path:'/channelhook',
  handler: function (request, reply) {
    const webhook = pusher.webhook({
      rawBody: JSON.stringify(request.payload),
      headers: request.headers
    });

    if(!webhook.isValid()) {
      console.log('Invalid webhook')
      return reply(400);
    } else {
      reply(200);
    }

    webhook.getEvents().forEach( e => {
      if(e.name == 'channel_occupied') {
        channels.add(e.channel)
      }
      if(e.name == 'channel_vacated') {
        channels.delete(e.channel)
      }
    });
  }
});
```

I'm using [hapi.js](http://hapijs.com/) here to serve up my webpages and I've created a `/channelhook` route that will receive the incoming webhooks. The format the payload is passed into `pusher.webhook()` is important for it to correctly validate. Once setup we can look through the events and update the new channels joined and existing channels vacated.

## Pokédata

The final piece is the Pokémon data. I'm using [Pokéapi](https://pokeapi.co/) which is simply amazing! It's a RESTful API of pretty much all Pokémon data you could want. I'm only using a tiny fraction of what it has available so I encourage you to go check out their [API documentation](https://pokeapi.co/docsv2/) if you're interested. As all Pokémon has an ID I simply generated a random number for each encounter and called the API with that ID. I could then get back the name, sprite URL, it's base HP and its types to use in the modal attack window.

```js
fetch(`http://pokeapi.co/api/v2/pokemon/${pokemonId}/`)
.then(res => {
  return res.json();
})
.then(pokemon => {
  const data = {
    id: pokemonId,
    name: pokemon.name,
    sprite: `https://pokeapi.co/media/sprites/pokemon/${pokemonId}.png`,
    coordinates: [lng, lat],
    expires: parseInt((new Date()).getTime() + duration, 10),
    hp: pokemon.stats.find(stat => stat.stat.name === 'hp').base_stat,
    types: pokemon.types.map(type => type.type.name[0] + type.type.name.substring(1))
  }

  pusher.trigger(bounds, 'encounter', data);
});
```

## Whats next?

I have a little list of planned features if I get the chance:
- Use the [catch rate calculation](http://bulbapedia.bulbagarden.net/wiki/Catch_rate) to improve the attack screen with fight/catch mechanics
- Add some points of interested
- Show other players, maybe add battling with each other
- Persistence!

## _So where can I see it already?!_

All the code is available on [GitHub](https://github.com/AverageMarcus/Pushermon-Go) and the game can be played at [https://pushermon-go.marcusnoble.co.uk/](https://pushermon-go.marcusnoble.co.uk/). If you have any questions feel free to tweet me at [@Marcus_Noble_](https://twitter.com/Marcus_Noble_).

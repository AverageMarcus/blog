---
layout: post.html
title:  "Automating the everyday"
date:  2022-04-22
tags: Automation IoT SmartTech
summary: |
  It wont come as a surprise to those that know me well, or have worked with me for any reasonable amount of time, but I'm _very_ keen on automation. I hate the tediumness of repetitive, simple tasks and value my time too highly to waste it.

  Automation makes up a large portion of my working life. Building applications and tools to achieve a goal, but also beyond that. It's a fairly common occurence that I say to a collegue on Slack
  "Oh, I have a script for that!" when they ask how to do something that is tedius and repetitive, just take a look at my [dotfiles](https://github.com/AverageMarcus/dotfiles) for examples.

  But I don't want to talk about that today, instead I'm going to talk about how I automate my everyday life, outside of work.
---

It wont come as a surprise to those that know me well, or have worked with me for any reasonable amount of time, but I'm _very_ keen on automation. I hate the tediumness of repetitive, simple tasks and value my time too highly to waste it.

Automation makes up a large portion of my working life. Building applications and tools to achieve a goal, but also beyond that. It's a fairly common occurence that I say to a collegue on Slack
"Oh, I have a script for that!" when they ask how to do something that is tedius and repetitive, just take a look at my [dotfiles](https://github.com/AverageMarcus/dotfiles) for examples.

But I don't want to talk about that today, instead I'm going to talk about how I automate my everyday life, outside of work.

I've mentioned some of the automation I have before on Twitter and it's gathered a bit of interest to learn more.

![](https://tweet.cluster.fun/1514570182513106946/)

![](https://tweet.cluster.fun/1514576057537605642/)

Before we get into the details, lets start of with looking at what a typical day might look like.

## Daily Routine

* My alarm wakes me up at 5am (I know, I'm an early bird).
* I get up and walk downstairs, as I do the lights in the landing and hallway automatically come on at about 20% brightness.
* I head into the kitchen to get a drink, again the lights come on at a nice 20% brightness.
* Open the back door to let the dog out, as I open the door to the garden an LED strip lights up the garden if it's still dark out.
* Now it's time to work, I head to my office and tap a few buttons on a tablet mounted on my desk to control lights and my monitor.
* Often I'll set one of my 3D printers going so I tap another button on my tablet to turn on and pre-heat my printer.
* While the printer is heating up I open it's [OctoPrint](https://octoprint.org/) page and pick a model to print.
* A little while later, lets say around 8am, I head back down to the kitchen, this time for a snack. As I do the lights come on again, but this time at 100% brightness as my eyes are now adjusted to the light.
* More work, maybe some meetings. As I join any meeting, a tablet outside my office updates to indicate I'm on a call so I'm not disturbed.
* Lunch time - back down to the kitchen for something to eat but this time the lights don't come on, there's enough natural light coming in through the windows.
* While eating lunch, my 3D printer finishes printing, it sends me a notification and shortly after turns itself off.
* After work I head out with the dog for a walk, as I open the front door the porce is lit up and turns off shortly after I've left. When I return it lights up again as I approach.
* Fast forward to bedtime - when tucked in I say to the Echo Dot in our bedroom "echo, goodnight!" which triggers an automation to turn off all lights in the house, warns us if any doors or windows are left open and then activates some sleep sounds for us to drift off too.

Ok, so that might not be a typical day every day but it does touch on much of the automation I have in place.

## Hardware

Throughout the house I have a lot of "smart" devices to control with my automations, while not an exhaustive list, this should give you an idea of what I have to work with:

* A server to run [Home Assistant](https://www.home-assistant.io/) (homelab Kubernetes cluster)
* A Raspberry Pi to run [Zigbee2MQTT](https://www.zigbee2mqtt.io/) with a [Sonoff USB Zigbee dongle](https://itead.cc/product/sonoff-zigbee-3-0-usb-dongle-plus/)
* Over 30 unique Zigbee devices - light bulbs, plug sockets, door sensors, motion sensors, temperature sensors, etc.
* Raspberry Pi's connected to each of my 3D printers
* Several [ESP8266](https://en.wikipedia.org/wiki/ESP8266) connected to programmable LED strips
* Various Amazon Echo devices (Dot and Show) in most rooms
* 6 mounted tablets displaying interactive dashboard to control the house and display information
* Ubiquity cameras set up around the house

## Software

I use [Home Assistant](https://www.home-assistant.io/) for the bulk of my automation / control. I have this running on my at-home Kubernetes but I have previously had this running from a Raspberry Pi with the same effect. I have the Home Assistant iOS app on my iPhone and all the mounted tablets I have are just displaying the Home Assistant web interface.

On top of this I also make use of [Zigbee2MQTT](https://www.zigbee2mqtt.io/) to control all my Zigbee devices and [Mosquitto](https://mosquitto.org/) as the MQTT broker. Home Assistant is then configured to control all my Zigbee devices via MQTT which means I can still have some control over things if Home Assistant is down for any reason (such as during an upgrade).

For my 3D printers I have two of them using [OctoPrint](https://octoprint.org/) on a Raspberry Pi (using [OctoPi](https://github.com/guysoft/OctoPi)) and my resin 3D printer is controlled by [Mariner](https://github.com/luizribeiro/mariner).

I have several LED strips around the house, almost all of these are controlled using [WLED](https://en.wikipedia.org/wiki/ESP8266) running on an ESP8266.

Almost all of my configuration of Home Assistant is done via yaml so I can easily migrate / backup / restore as needed. For an example of best practices when it comes to configuration management I highly recommend checking out [Frenck's home-assistant-config](https://github.com/frenck/home-assistant-config) repo.

## Types of Automation

I wasn't sure how best to structure this as a lot of the automation I've built has grown organically out of a specific need whenever one arises. To make things a little easier to follow I'm going to break things down into "domains" and explain the different approaches I take.

### Lights

Automating lights is very common these days, there are countless smart bulbs available to buy with a whole range of different features.

I've generally got 3 different types of controlled lights:

* A mix of different Zigbee bulbs (I had previously had some issues with WiFi bulbs so switched to all Zigbee, the added benefit here is that you can be sure all communication is kept local and not reliant on some cloud service that may stop working one day)
* Plain old "dumb" bulbs fitted in lamps connected to (Zigbee) smart switches
* Programmable LED strips controlled by [WLED](https://en.wikipedia.org/wiki/ESP8266) running on an ESP8266

The Zigbee bulbs and LED strips can all have their brightness controlled with a subset of those also able to control the colour they emit. The bulbs fitted in lamps with smart switches can only be turned on or off, nothing more.

On their own, "smart" lighting isn't all that smart. Something still needs to control it. For me that's Home Assistant which can be used to manually control the lights via the app, any of the dashboards I have set up or via Amazon Echo's.

But that alone doesn't really make them smart, to do that we need to add some more (Zigbee) devices into the mix:

* Door open/close sensors - I use these on external doors, toilet doors, the garden gate and the garage to trigger automations
* Motion sensors - I have these set up in most communal rooms in the house as well as over the porch and the driveway

Each of these can be used as a trigger in Home Assistant to kick off whatever automation you set up. In yaml it would look a little like this:

```yaml
trigger:
    # Door sensor
  - platform: state
    entity_id: binary_sensor.groundfloor_bathroom_door_sensor_contact
    to: 'on'
    # Motion sensor
  - platform: state
    from: 'off'
    to: 'on'
    entity_id: binary_sensor.pantry_motion_sensor_occupancy
```

As I mentioned above, I also have the brightness of my lights vary based on the time of the day to avoid being blinded by them when I first wake. Home Assistant makes it very easy to use time of day in automations (as well as position of the sun). In my case, between 10pm and 7am I want all the automaticaly controlled lights to come on at 20% brightness and outside of that timeframe they should be 100% unless there's already enough natural light in the room. As the "dumb" bulbs in lamps can't have their brightness controlled, these aren't turned on during the 20% brightness phase.

E.g. this is my full automation for my kitchen lights, commented to explain what each bit does:

```yaml
- id: kitchen_lights
  alias: 💡 Kitchen Lights
  description: Turn the kitchen lights on and off based on presence
  mode: restart
  trigger:
  # I've got a group of multiple motion sensors for the kitchen, this allows me to treat them all as a single sensor.
  # I could instead list each here individually as different triggers and it'd work the same.
  - platform: state
    entity_id: group.kitchen_presence_sensors
    from: 'off'
    to: 'on'
  action:
  - choose:
    - conditions:
      # We only want to turn the lights on if needed, here we're checking how bright the room currently is
      - condition: numeric_state
        entity_id: sensor.kitchen_motion_sensor_illuminance
        below: '50'
      sequence:
      - service: light.turn_on
        data_template:
          # We store the current brightness in a variable that's set by another automation (more on that below)
          brightness_pct: '\{\{ states("var.light_brightness") | float }}'
        entity_id: light.kitchen_ceiling_light
  - choose:
    # If the room is dark and we're not during out 20% brightness phase we also want to turn on the lamps
    - conditions:
      - condition: state
        entity_id: var.light_brightness
        state: '100'
      - condition: numeric_state
        entity_id: sensor.kitchen_motion_sensor_illuminance
        below: '50'
      sequence:
      - parallel:
        - service: homeassistant.turn_on
          entity_id: switch.kitchen_lamp_switch
        - service: homeassistant.turn_on
          entity_id: light.kitchen_cabinets_lightgroup
          data:
            brightness_pct: 100
  # After turning the lights on we want to wait until no more motion is detected in the room
  - wait_for_trigger:
    - platform: state
      entity_id: group.kitchen_presence_sensors
      from: 'on'
      to: 'off'
    timeout: 00:30:00
    continue_on_timeout: true
  # We then wait 5 minutes more after no motion is detected
  - delay:
      hours: 0
      minutes: 5
      seconds: 0
      milliseconds: 0
  # Finally we turn off all the kitchen lights as they're no longer needed
  - service: homeassistant.turn_off
    target:
      entity_id: group.kitchen_lights
```

You'll notice that I'm using a variable for the brightness (`var.light_brightness`), the reason for this is to reuse code so if I ever want to change the brightness I can update just one automation rather than all of them. I'm using [snarky-snark/home-assistant-variables](https://github.com/snarky-snark/home-assistant-variables) for the variables support and the following automation that updates the value of the variable based on the time of day.

```yaml
- id: set_brightness
  alias: ⚙️ Set light brightness
  description: Set the desired light brightness based on time of day
  trigger:
  - platform: time_pattern
    minutes: /5
  action:
  - choose:
    - conditions:
      - condition: time
        after: '07:00'
        before: '22:00'
      sequence:
      - service: var.set
        data:
          value: 100
        entity_id: var.light_brightness
    default:
    - service: var.set
      data:
        value: 20
      entity_id: var.light_brightness
  mode: single
```

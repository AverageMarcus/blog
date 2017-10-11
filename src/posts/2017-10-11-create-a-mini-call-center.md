---
layout: post.html
title:  Create your own mini call center with Twilio
date:   2017-10-11
tags:
summary: "Have you ever wanted to run your own call center, but, like, a really small one? No? OK, do you know of any small groups of people that could benefit from all being contactable with a single number? Imagine a conference or meetup with a phone number you can call to report code of conduct violations that will put you through to the first available organiser.


I'm going to show you how you can do this with the help of [Twilio](https://www.twilio.com/) and a small Node.js application."
---

Have you ever wanted to run your own call center, but, like, a really small one? No? OK, do you know of any small groups of people that could benefit from all being contactable with a single number? Imagine a conference or meetup with a phone number you can call to report code of conduct violations that will put you through to the first available organiser.

I'm going to show you how you can do this with the help of [Twilio](https://www.twilio.com/) and a small Node.js application.

First steps would be [signing up for Twilio](https://www.twilio.com/try-twilio) and acquiring a [new phone number](https://www.twilio.com/console/phone-numbers). Once setup you will need to configure your number to work with the Node.js application we will be building. Setup your number like shown below:

{{> picture alt="Twilio phone number configuration" caption="Twilio phone number configuration" url="/images/twilioPhoneNumberConfig.png" }}

* **Accept Incoming**: Voice calls
* **Configure with**: Webhooks, or TwiML Bins or Functions
* **A call comes in**: Webhook **/** {URL of your application} **/** HTTP GET
* **Call status changes**: {URL of your application}/updates **/** HTTP GET
* _All other settings can be ignored._

> While developing locally I recommend using [ngrok](https://ngrok.com/) to create a secure tunnel to localhost. The rest of this post will assume you have that setup, running and that is the URL you have used above.

With our new number configured we can make a start on building the application to handle it. Before we move on it is a good idea to find you [Account SID / Auth Token](https://www.twilio.com/console) as we'll need these shortly and make sure you know where the [Twilio Debugger](https://www.twilio.com/console/runtime/debugger?quickDate=24) is as this is super useful if anything goes wrong.

We are aiming to create an application that will listen for an incoming call and then call out to all of our defined organisers. Once one of them picks up the incoming call will be connected to that organiser and the remaining outgoing calls will be cancelled.

Lets begin! Create a new Node.js project and install `express`, `twilio` and `config`.

```shell
npm init -f
npm install --save express twilio config
```

> _**Note:** All code examples are in [TypeScript](https://www.typescriptlang.org/)_, you can use standard JavaScript without too much being changed but I won't be covering that in this post.

Our initial project setup will look something like this:

```text
├─ config
│  └─ default.json
├─ callHandler.ts
├─ index.ts
├─ package.json
└─ tsconfig.json
```

As [Twilio](https://www.twilio.com/) uses webhooks for all incoming actions we will be using [Express](https://expressjs.com/) to listen for the HTTP requests.


```typescript
/* 📄 index.ts */
import * as CallHandler from './callHandler'; // We'll be creating this shortly
import * as Express from 'express';
const app = Express();

app.get('/', async (req: Express.Request, res: Express.Response) => {
  res.set({ 'Content-Type': 'text/xml' });
  res.status(200).send(await CallHandler.initiateCall(req.query.CallSid)); // CallSid is a unique ID for the incoming call
});

app.get('/join', async (req: Express.Request, res: Express.Response) => {
  res.set({ 'Content-Type': 'text/xml' });
  res.status(200).send(await CallHandler.joinCall(req.query.id));
});

app.get('/updates', async (req: Express.Request, res: Express.Response) => {
  // TODO: We will handle all event updates here later
  res.status(200).end();
});

app.listen(7000, () => {
  console.log(`Server running at http://127.0.0.1:7000/`);
});
```

When someone calls our new number Twilio will send a request to `'/'`, any changes made to that call (for example the user hanging up) and a request will be made to `'/updates'` with all the details. Finally we will use the `'/join'` endpoint to direct our organisers to in order to connect their call. For now we will focus on receiving the inbound call, Twilio expects us to respond with some text telling it what to do with the call. We can use the [Twilio NPM module](https://www.npmjs.com/package/twilio) to help us here. When we get an inbound call we will create a new conference call (using the ID of the call as the unique name) and have the caller join.

```typescript
/* 📄 callHander.ts */
import * as Twilio from 'twilio';
const VoiceResponse = Twilio.twiml.VoiceResponse;

interface Call {
  status: 'pending' | 'active' | 'ended';
  outgoingNumbers: { [key: string]: string };
}

interface CallList {
  [key: string]: Call;
}

// We will use this to keep track of the status of each call
const calls: CallList = {};

export async function initiateCall(callId: string) {
  calls[callId] = {
    status: 'pending',
    outgoingNumbers: {}
  };

  const voiceResponse = new VoiceResponse();
  const dial = voiceResponse.dial();
  dial.conference({
      beep: false,
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
      maxParticipants: 2
  }, callId);
  return voiceResponse.toString();
}
```

Great! Now we have our caller sat in a conference call all alone. Wouldn't it be good if they had someone to talk to?

Lets create a function that will call out to each of our organisers. We are using the [config](https://www.npmjs.com/package/config) NPM module to pull in some configuration variables.

```typescript
/* 📄 callHander.ts */
import * as Config from 'config';
const client = Twilio(Config.get<string>('twilio.accountSid'), Config.get<string>('twilio.authToken'));

const hostname = Config.get<string>('hostname'); // The full hostname we set up earlier as the 'A call comes in' webhook
const fromNumber = Config.get<string>('twilio.phoneNumber'); // Our Twilio phone number
const organisersNumbers = Config.get<string[]>('organisersNumbers'); // An array of all numbers we want to try and call out to

function callOut(callId: string): void {
  organisersNumbers.forEach(number => {
    console.log(`Calling +${number}`);
    client.calls.create({
      url: `${hostname}/join?id=${callId}&number=${number}`,
      method: 'GET',
      to: `+${number}`,
      from: `+${fromNumber}`,
      machineDetection: 'Enable'
    }).then((call) => {
      calls[callId].outgoingNumbers[number] = call.sid;
    });
  });
}
```

Lets go back to our `initiateCall` and trigger our new function.

```typescript
/*  📄callHander.ts */
export async function initiateCall(callId: string) {
  calls[callId] = {
    status: 'pending',
    outgoingNumbers: {}
  };

  callOut(callId);

  const voiceResponse = new VoiceResponse();
  const dial = voiceResponse.dial();
  dial.conference({
      beep: false,
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
      maxParticipants: 2
  }, callId);
  return voiceResponse.toString();
}
```

We now have all our organisers being called when someone calls our number but so far nothing will happen when they pick up. Lets add the `joinCall` function that will have the organiser join the conference call we have previously set up with our inbound caller.

```typescript
/* 📄 callHander.ts */
export async function joinCall(callId: string) {
  const voiceResponse = new VoiceResponse();
  const dial = voiceResponse.dial();
  dial.conference({
      beep: false,
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
      maxParticipants: 2
  }, callId);
  return voiceResponse.toString();
}
```

Hurray! We now have two people talking to each other!

But... we still have outbound calls waiting to be picked up. We need to handle those. Lets create a function to hangup all other calls.

```typescript
/* 📄 callHandler.ts */
export async function hangup(callId: string, ignore?: string): void {
  organisersNumbers.filter(number => number !== ignore).forEach(number => {
    client.calls(calls[callId].outgoingNumbers[number])
      .update({
        status: 'canceled'
      });
    delete calls[callId].outgoingNumbers[number];
  });

  if (Object.keys(calls[callId].outgoingNumbers).length === 0) {
    // All calls hung up
    calls[callId].status = 'ended';
  }
}
```

We need to make sure we don't hang up our connected call so lets pass through the number so we can ignore it.

```typescript
/* 📄 index.ts */
app.get('/join', async (req: Express.Request, res: Express.Response) => {
  res.set({ 'Content-Type': 'text/xml' });
  res.status(200).send(await CallHandler.joinCall(req.query.id, req.query.number));
});

/* 📄 callHandler.ts */
export async function joinCall(callId: string, number: string) {

  hangup(callId, number);

  const voiceResponse = new VoiceResponse();
  const dial = voiceResponse.dial();
  dial.conference({
      beep: false,
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
      maxParticipants: 2
  }, callId);
  return voiceResponse.toString();
}
```

It's also a good idea to make sure that if someone manages to pick up before we have a chance to hang up the call we handle it correctly by cancelling.

```typescript
/* 📄 callHandler.ts */
export async function joinCall(callId: string, number: string) {
  const voiceResponse = new VoiceResponse();
  if (!calls[callId]) {
    voiceResponse.hangup();
  } else if(calls[callId].status !== 'pending') {
    delete calls[callId].outgoingNumbers[number];
    voiceResponse.hangup();
  } else {
    // Mark our call as active to prevent any other organisers joining
    calls[callId].status = 'active';

    hangup(callId, number);

    const dial = voiceResponse.dial();
    dial.conference({
        beep: false,
        startConferenceOnEnter: true,
        endConferenceOnExit: true,
        maxParticipants: 2
    }, callId);
  }
  return voiceResponse.toString();
}
```

Finally, we need to make sure we cancel all outbound calls if the initial caller decides to hang up before anyone has answered. For this we'll need to use our `'/updates'` endpoint.

```typescript
/* 📄 index.ts */
app.get('/updates', async (req: Express.Request, res: Express.Response) => {
  if (req.query.CallStatus === 'completed' && req.query.Direction === 'inbound') {
    // We're not providing a number to ignore here so all outbound calls will be cancelled
    CallHandler.hangup(req.query.CallSid);
  }
  res.status(200).end();
});
```

That's it! We now have a working, albeit a little crude, call center.

## Bonus

### Answering machine detection

This approach isn't great if one of our organisers has their phone turned off and our user gets put through to someone's voicemail rather than waiting for someone who is available to pick up. You may have noticed in the `callOut` function that we are setting the `machineDetection: 'Enable'` property. This allows us to check if the call was picked up by a real person or not. We can use this by making a small change to our `joinCall` function.

```typescript
/* 📄 index.ts */
app.get('/join', async (req: Express.Request, res: Express.Response) => {
  res.set({ 'Content-Type': 'text/xml' });
  res.status(200).send(await CallHandler.joinCall(req.query.id, req.query.number, req.query.AnsweredBy === 'human'));
});

/* 📄 callHandler.ts */
export async function joinCall(callId: string, number: string, isHuman: boolean) {
  const voiceResponse = new VoiceResponse();

  if (!calls[callId]) {
    voiceResponse.hangup();
  } else if(calls[callId].status !== 'pending') {
    delete calls[callId].outgoingNumbers[number];
    voiceResponse.hangup();
  } else {
    // Mark our call as active to prevent any other organisers joining
    calls[callId].status = 'active';

    hangup(callId, number);

    const voiceResponse = new VoiceResponse();
    const dial = voiceResponse.dial();
    dial.conference({
        beep: false,
        startConferenceOnEnter: true,
        endConferenceOnExit: true,
        maxParticipants: 2
    }, callId);
  }

  return voiceResponse.toString();
}
```

### Wait for answer before connecting to conference call

Having a mini call center is great and all but one thing that isn't great is... _hold music_. No one wants to sit and listen to some small clip of music on loop while waiting for someone to answer. It's much more natural and comfortable to have a ringing tone while waiting for someone to answer.

We can achieve this by simply delaying our initial response until one of our organisers have answered. There will be a little awkward silence for our organiser while our caller connects but this shouldn't cause any issues.

```typescript
/* 📄 callHander.ts */
export async function initiateCall(callId: string) {
  calls[callId] = {
    status: 'pending',
    outgoingNumbers: {}
  };

  callOut(callId);

  const voiceResponse = new VoiceResponse();

  return new Promise((resolve) => {
    let intervalId = setInterval(() => {
      if (calls[callId] && calls[callId].status === 'active') {
        clearInterval(intervalId);

        const dial = voiceResponse.dial();
        dial.conference({
            beep: false,
            startConferenceOnEnter: true,
            endConferenceOnExit: true,
            maxParticipants: 2
        }, callId);
        return resolve(voiceResponse.toString());
      } else if (!call[callId] || calls[callId].status === 'ended') {
        clearInterval(intervalId);
        voiceResponse.hangup();
        return resolve(voiceResponse.toString());
      }
    }, 500);
  });
}
```

The final product can be found on GitHub - [AverageMarcus/SharedPhone](https://github.com/AverageMarcus/SharedPhone). I would be happy for any issues reported, enhancement suggestions or pull requests.

---
layout: page.html
title:  "About"
---

Please forgive my brevity, I am a man of few words. One would think that after many years on this planet I would have more to say about myself but alas I simply do not. I am a man that likes to code, to shut out the world and get lost in <code>If</code> statements and <code>try/catch</code> blocks.


For years now, as long as I can accurately remember, I have been hacking away at code, scripts and markup. I began this journey many, many, many moons ago playing around with Dreamweaver (is this still around?) to make simple websites. From there I started to pick apart the <strong>HTML</strong> that was generated, I started using server-side languages such as <strong>PHP</strong> and I began to play with desktop programming (<strong>Python</strong> when I first started).


Over the years, throughout my education and working life, I have developed skills in <strong>Java</strong> (my first meeting back in 2008 with the release of the <a href="http://www.android.com/">Android <i class="icon-external-link"></i></a> platform), <strong>C# .NET</strong>, various web technologies (<strong>JavaScript</strong>, <strong>ASP .NET</strong>, <strong>HTML5</strong>) and my passion to learn more keeps growing.


If you need to get in touch with me, you can find me on either Twitter: <a href="https://www.twitter.com/Marcus_Noble_">@Marcus_Noble_</a> or Github: <a href="https://www.github.com/AverageMarcus">AverageMarcus</a>


## Experience

<ul class="experience-list">
    {{#each collections.experience}}
      <li class="card">
        <span class="label label-info">{{moment this.start 'MMMM YYYY'}} &mdash; {{#if this.end}}{{moment this.end 'MMMM YYYY'}}{{else}}Ongoing{{/if}}</span>
        <h3>
          <a href="{{this.url}}">{{this.title}} <i class="icon-external-link"></i></a>
        </h3>
        <strong>{{this.role}}</strong>
        <blockquote>
          {{{this.contents}}}
        </blockquote>
      </li>
    {{/each}}
</ul>
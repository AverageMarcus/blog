---
layout: post.html
title:  "The Power of the Bookmarklet"
date:   2013-11-21
tags:
summary: "Recently an occasion came up where I found myself repetitively typing in the same type of text into a web form. The form in question is the 'Tag this build' page in <a href='http://jenkins-ci.org/' target='_blank'>Jenkins</a>."
---

Recently an occasion came up where I found myself repetitively typing in the same type of text into a web form. The form in question is the "Tag this build" page in [Jenkins](http://jenkins-ci.org/).

![Tag this build]({{ site.url }}/images/tagthisbuild-1.PNG)

I realised that the 'Tag URL' I was entering followed a very specific pattern. The first part was taken from the 'Module URL' (here blurred out) minus the string after the final '/'. This is then followed by todays date, the name of the job being tagged (dev_Authenticate-Build-Mobile in this case) and finally the string after the final '/' we ommitted from the beginning.

The code monkey in me was crying out for this to be automated, and as a lover of JavaScript what better way to accomplish it than a nice and simple script. So I set to work! The script I currently use is very much tailored to our setup and uses hard coded URL's. As we only have two SVN repositories this was more than acceptable.

The code:
<pre><code class="javascript">
(function(){
	//Find all labels that are for the tag boxes
	jQuery("label[for^='tag']").each(function(){
		var url = "",
			id = jQuery(this).attr('for').replace("tag", ""),
			now = new Date(),
			today = now.getFullYear().toString() + ((now.getMonth()+1).toString().length == 1 ? "0"+(now.getMonth()+1).toString() : (now.getMonth()+1).toString()) + (now.getDate().toString().length == 1 ? "0"+now.getDate().toString() : now.getDate().toString()),
			re = /([a-zA-Z-_]+)\/(\d+)\//,
			buildProject = document.URL.match(re)[1] //Get the build job from the current URL
			;

		//We have two repositories so we simply need to check which one to use and build the URL
		if(jQuery(this).text().indexOf("BIS/")>= 0){
			var application = jQuery(this).text().substring(jQuery(this).text().lastIndexOf("BIS/")+4, jQuery(this).text().indexOf(" ") );
			url = "https://svn.example.ac.uk/BIS/RELEASE/"+today+"/" + buildProject + "/"+application;
		}else if(jQuery(this).text().indexOf("J2EE/")>= 0){
			var application = jQuery(this).text().substring(jQuery(this).text().lastIndexOf("J2EE/")+5, jQuery(this).text().indexOf(" ") );
			url = "https://svn.example.ac.uk/J2EE/release/"+today+"/" + buildProject + "/"+application;
		}
		//Populate the tag input
		jQuery("input[id='name"+id+"']").val(url);
	});
	//Add a comment
	jQuery("textarea[name='comment']").val(jQuery("textarea[name='comment']").val().replace("#", "Jenkins Build "));
	return false;
})();
</code></pre>

The code requires [jQuery](http://jquery.com/) but as Jenkins already uses it I didn't need to reference it in the script.

Now to make this useful I turned this script into a bookmark that I could place in my browser's bookmark bar and click to execute the script. I used a very simple tool to do this, http://mrcoles.com/bookmarklet/, simply enter the script, click convert and drag the result into your bookmarks.

The end result looks something like this:
<pre><code class="javascript">
javascript:(function()%7B(function()%7BjQuery("label%5Bfor%5E%3D'tag'%5D").each(function()%7Bvar url %3D ""%2Cid %3D jQuery(this).attr('for').replace("tag"%2C "")%2Cnow %3D new Date()%2Ctoday %3D now.getFullYear().toString() %2B ((now.getMonth()%2B1).toString().length %3D%3D 1 %3F "0"%2B(now.getMonth()%2B1).toString() %3A (now.getMonth()%2B1).toString()) %2B (now.getDate().toString().length %3D%3D 1 %3F "0"%2Bnow.getDate().toString() %3A now.getDate().toString())%2Cre %3D %2F(%5Ba-zA-Z-_%5D%2B)%5C%2F(%5Cd%2B)%5C%2F%2F%2CbuildProject %3D document.URL.match(re)%5B1%5D%3Bif(jQuery(this).text().indexOf("BIS%2F")>%3D 0)%7Bvar application %3D jQuery(this).text().substring(jQuery(this).text().lastIndexOf("BIS%2F")%2B4%2C jQuery(this).text().indexOf(" ") )%3Burl %3D "https%3A%2F%2Fsvn.example.ac.uk%2FBIS%2FRELEASE%2F"%2Btoday%2B"%2F" %2B buildProject %2B "%2F"%2Bapplication%3B%7Delse if(jQuery(this).text().indexOf("J2EE%2F")>%3D 0)%7Bvar application %3D jQuery(this).text().substring(jQuery(this).text().lastIndexOf("J2EE%2F")%2B5%2C jQuery(this).text().indexOf(" ") )%3Burl %3D "https%3A%2F%2Fsvn.example.ac.uk%2FJ2EE%2Frelease%2F"%2Btoday%2B"%2F" %2B buildProject %2B "%2F"%2Bapplication%3B%7DjQuery("input%5Bid%3D'name"%2Bid%2B"'%5D").val(url)%3B%7D)%3BjQuery("textarea%5Bname%3D'comment'%5D").val(jQuery("textarea%5Bname%3D'comment'%5D").val().replace("%23"%2C "Jenkins Build "))%3Breturn false%3B%7D)()%7D)()
</code></pre>

Now the next time I want to tag a build I simple click my bookmarklet and I'm all done. Much better. (:

And just to show how fun bookmarklets can be, head over to [Kick Ass](https://kickassapp.com/) and have fun destroying the web!

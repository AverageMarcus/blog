---
layout: post.html
title:  "Passing Properties to your GateKeeper"
date:   2013-10-22
tags: Java
summary: "Recently I've had to re-visit some old code containing a couple GateKeepers I wrote nearly two years ago. Looking at them now I realise how terribly unscalable they are. The gatekeepers are in place to protect some web service's and specify (in the gatekeeper code) which methods are open to all and which need restriction. <br/><br/>This is how not to write a gatekeeper."
---

Recently I've had to re-visit some old code containing a couple GateKeepers I wrote nearly two years ago. Looking at them now I realise how terribly unscalable they are. The gatekeepers are in place to protect some web service's and specify (in the gatekeeper code) which methods are open to all and which need restriction.

This is how not to write a gatekeeper.

While we don't have the effort or need to change it I have been thinking about how this could be better should it be done in the future.

What I have come up with (so far, this is very much a <abbr title="Work in Progress">WIP</abbr>) is a method of passing properties to the gatekeeper for each method to specify how the gatekeeper should act.

The idea boils down to using a custom annotation that the GateKeeper can access values of.

<pre><code class="java">
/**
 * Provides a method annotation for use by a GateKeeper
 * @author Marcus
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface GateKeeperProperty {
    enum AccessLevel{
        PUBLIC, OWN_CONTENT, ADMIN
    }
    public boolean logAccess() default true;
    public AccessLevel accesLevel() default AccessLevel.PUBLIC;
}
</code></pre>

This annotation can then be used on your webservice methods to pass values regarding to logging access and access restriction.

<pre><code class="java">
/**
 * Example web service demonstrating gatekeeper properties
 * @author Marcus Noble
 */
@Interceptors(GateKeeper.class)
@WebService(serviceName = "ExampleWebService")
@Stateless()
public class ExampleWebService {

    @WebMethod(operationName = "getListOfCountries")
    @GateKeeperProperty(accesLevel = GateKeeperProperty.AccessLevel.PUBLIC, logAccess = false)
    public List<String> getListOfCountries() {
        // Fetch country list
        return new ArrayList<String>();
    }

    @WebMethod(operationName = "getPersonFamilyName")
    @GateKeeperProperty(accesLevel = GateKeeperProperty.AccessLevel.OWN_CONTENT, logAccess = false)
    public String getPersonFamilyName(@WebParam(name="sessionId") String sessionId, @WebParam(name="userId")  int userId) {
        // Fetch person's family name
        return "";
    }

    @WebMethod(operationName = "getSuperSecretData")
    @GateKeeperProperty(accesLevel = GateKeeperProperty.AccessLevel.ADMIN, logAccess = true)
    public String getSuperSecretData(@WebParam(name="sessionId") String sessionId) {
        // Fetch super secret data
        return "";
    }
}
</code></pre>

Here we have three different method that perform three different types of action.

The first simply returns a list of country names, there is no reason to perform any restriction or logging on this as it is simply a helper method to populate a dropdown list.

The second requires slightly more restriction as we are potentially exposing private data. Here we have stated that the restriction is `OWN_CONTENT` which I have defined as 'The requesting user can only access data owned or related to that user' so in this case they can only request their own family name.

> Why not just pass in the sessionId and work it out from that?

This is a good question. It could very well be done this way without any difficulty. The reason for the sessionId and userId is so admin users or 'privileged systems' can call the method and the GateKeeper can be built to allow it.

Finally we have a method that exposes one of our deep dark system secret. This must only be accessible by our most trusted of users, our admins. So for this we make sure the access limit is set to `ADMIN` and logging is enabled so we can keep an eye on any unusal behaviour.

So by this point you may be wondering what magic the GateKeeper needs to perform to bring this all together. Well it's actually quite simple, the `InvocationContext` passed in to the `@AroundInvoke` interceptor method give you access to everything about the called method including its annotation.

<pre><code class="java">
@AroundInvoke
public Object intercept(InvocationContext ctx) throws Exception {
	Method method = ctx.getMethod();
    	if(method.isAnnotationPresent(GateKeeperProperty.class)){
        GateKeeperProperty gatekeeperProperty = method.getAnnotation(GateKeeperProperty.class);
        // do something with the annotation
	}
}
</code></pre>

So with this we have access to values associated with the calling method without the need to pre-define the method in the GateKeeper. This is a huge advance from my original GateKeeper, no more hard coded lists of public and private method that often get out of date or contain duplicates.

So in full our GateKeeper may look something like...

<pre><code class="java">
/**
 * An example GateKeeper reading properties provided by the methods
 * @author Marcus
 */
public class GateKeeper {

    @AroundInvoke
    public Object intercept(InvocationContext ctx) throws Exception {
        Method method = ctx.getMethod();
        boolean logAccess = true; // Default action
        GateKeeperProperty.AccessLevel accessLevel = GateKeeperProperty.AccessLevel.PUBLIC; // Default access level
        boolean accessGranted = true; // By default people have access (if you have more private method it is best to set this to false)

        if(method.isAnnotationPresent(GateKeeperProperty.class)){
            GateKeeperProperty gatekeeperProperty = method.getAnnotation(GateKeeperProperty.class);
            logAccess = gatekeeperProperty.logAccess();
            accessLevel = gatekeeperProperty.accesLevel();
        }

        switch(accessLevel){
            case PUBLIC :
            default:
                accessGranted = true;
                break;
            case OWN_CONTENT :
                accessGranted = ensureOwnContent(ctx);
                break;
            case ADMIN :
                accessGranted = ensureAdmin(ctx);
                break;
        }

        try {
            if(logAccess){
                Log.log("Calling "+method.getName());
            }
            if(accessGranted){
                return ctx.proceed();
            }else{
                if(logAccess){
                    Log.log("Access prevented to "+method.getName());
                }
                return null;
            }
        } catch (Exception e) {
            if(logAccess){
                Log.log("Failed Calling "+method.getName());
            }
            return null;
        }finally{
            if(logAccess){
                Log.log("Finished Calling "+method.getName());
            }
        }
    }

    private boolean ensureOwnContent(InvocationContext ctx){
        // Perform checks that user is accessing own data
        return false;
    }

    private boolean ensureAdmin(InvocationContext ctx){
        // Perform checks that user is an admin
        return false;
    }
}
</code></pre>

Hopefully in the future this may become of use to me and provide a more scalable GateKeeper class. I am still tossing around the idea of how to correctly handle the `OWN_CONTENT` or similar type of restriction that requires some knowledge of the method's inputs and outputs, hopefully that will come to me soon...

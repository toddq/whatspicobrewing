### What's PicoBrewing?

I like my Picobrew quite a bit, but the web interface leaves quite a bit to be desired.  I thought I'd try my hand at improving the brew session view, as when I'm brewing from the couch I like to keep an eye on what the Zymatic's up to in the basement and the graph view wasn't showing the information ***I*** thought was useful.  I wanted something that reflected a view closer to what the LCD screen shows as it's brewing.  And with a web view having more real estate to work with, it might as well show more too.  I put this together over a couple evenings (while Picobrewing of course) as an alternative view of the current brew session.  It's not currently intended to completely replace the default view, but to supplement it (though the only real missing feature is the notes, and they could easily be added).


[<img src="http://i.imgur.com/sxwaMxx.png" width="200px">]
(http://i.imgur.com/sxwaMxx.png)
[<img src="http://i.imgur.com/whs5OUE.png" width="200px">]
(http://i.imgur.com/whs5OUE.png)



### Using

###### Userscript
The easiest thing is to install the browser user script which will add links to the Picobrew website to open the alternative view.  

- First install either [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) (if using Chrome) or [Greasemonkey](https://addons.mozilla.org/en-us/firefox/addon/greasemonkey/) (if using Firefox).
- Then install the script by visiting [this link](http://toddq.github.io/whatspicobrewing/userscript/picobrew.user.js) and clicking 'Install'.
- When logged into the [Picobrew](https://picobrew.com/) website you'll now see some new links or buttons for [Alt View] that will open in a new tab.

###### Direct
Alternatively you can connect to the page directly and enter your user id, machine id, and session id. To use with a mobile device (that doesn't allow userscripts) you'll need to send yourself the link for your machine.

[https://toddq.github.io/whatspicobrewing](https://toddq.github.io/whatspicobrewing)

- Your user id (it's not the one you log in with) can be retrieved by logging into your [Picobrew](https://picobrew.com/) account, opening the Javascript console, and entering `$('#user').val()`.
- Your machine id can be retrieved from the [Picobrew Settings](https://picobrew.com/Members/User/EditSettings.cshtml) page.  It's the 'Zymatic ID'.
- Session ids are available from the url when viewing session data on the Picobrew site.  If you leave the session id out and you're currently brewing, the active brew session will automatically be shown.

I'm hosting the page publicly for your convenience, but it's designed as a simple single page that you're welcome to download and run on your own computer.  A web server isn't even required, it can simply be loaded from the file system.


### TODO

- Add a link to the Now Brewing section at /Members/User/brewhouse.cshtml when active.
- Add Notes
    - View
    - Create/Edit/Delete

I like my Picobrew quite a bit, but the web interface leaves quite a bit to be desired.  I thought I'd try my hand at improving the brew session view, as when I'm brewing from the couch I like to keep an eye on what the Zymatic's up to in the basement and the graph view wasn't showing the information ***I*** thought was useful.  I wanted something that reflected a view closer to what the LCD screen shows as it's brewing.  And with a web view having more real estate to work with, it might as well show more too.  I put this together over a couple evenings (while Picobrewing of course) as an alternative view of the current brew session.  It's not currently intended to completely replace the default view, but to supplement it (though the only real missing feature is the notes, and they could easily be added).


### Using

The easiest thing is to install the browser user script which will add links to the Picobrew website to open the alternative view.  
[Instructions to do so here]

Alternatively you can connect to the page directly and enter your user id, machine id, and session id. [link]

I'm hosting the page publicly for your convenience, but it's designed as a simple single page that you're welcome to download and run on your own computer.  A web server isn't even required, it can simply be loaded from the file system.


### TODO
- Userscript
    - ~~Create it~~
    - Document it (installation)
- Create Github project
- ~~Setup Firebase static hosting~~
- Add polling update for current brew session
- ~~Detect completed steps w/ missing log data~~
- ~~Attempt to detect Pause steps (like connect chiller)~~
- ~~Responsive design (tablet, phone)~~
- ~~Code cleanup~~
- ~~Update dependencies (Angular, Bootstrap)~~
- Use Travis/Gulp to build app and push to GH Pages
- Test with live session
- Improve this README
- Notes
    - view
    - create/edit/delete

/* flickeep on the App Store — the one place to change when it goes live.
   id: App Store Connect › flickeep › App Information › Apple ID (digits only).
   pt: optional provider token (App Store Connect › App Analytics › Campaigns). With it,
       each button gets its own campaign link, so downloads per button show up in
       App Analytics; the site itself runs no analytics. */
window.FLICKEEP = { id: "", pt: "" };

(function (d, s) {
  d.documentElement.classList.add("js", s.id ? "live" : "soon");
  // Safari on iPhone shows its own “Open in the App Store” banner.
  if (s.id) d.write('<meta name="apple-itunes-app" content="app-id=' + s.id + '">');
  // If the page script never runs, show everything anyway.
  setTimeout(function () { if (!window.flickeepReady) d.documentElement.classList.remove("js"); }, 3000);
})(document, window.FLICKEEP);

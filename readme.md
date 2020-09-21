# Acthung WebRTC
This is a wrongly spelled re-make of [Achtung die Kurve!](https://sv.wikipedia.org/wiki/Achtung,_die_Kurve!) adding support for using your phone as a gamepad by connecting from WebRTC. Uses React for non performance sensitive part and also for lobby/player state.

Client app used for both server and clients is in /client-app (containing 99% of actual code).

A simple signaling server for lobby RTC peer discovery is in /signaling-app (literally like 20 lines of code).

## How to play
1. Get a pc, phone, a friend with another phone.
2. Connect all devices to the same wifi, no TURN server is available.
3. On pc, with modern browser, go to https://tobiasmelen.github.io/acthung-webrtc and start a new lobby
4. Join lobby url on phones (QR for convienience)
5. Play the game.

## Why?
I wanted to learn how to actually use WebRTC and non trivial usage of React hooks/effects. It's also really fun to build UI that's distributed over multiple devices.
This is very much a hobby project, more often than not broken, code quality is a bit all over the place.

## Current status
My initial plan was to get this running on Chromecasts and make it a local multiplayer game for the platform. However, after trying it out i think the performance optimizations needed for that platform is unfeasable. That cooled my inspiration for the project.
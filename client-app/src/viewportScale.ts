//Chromecast lays pages out at 1280x720 CSS pixels, scale down so it looks like 1080p.
const viewportScale = navigator.userAgent.includes("CrKey")
  ? window.innerHeight / 1080
  : 1;

export default viewportScale;

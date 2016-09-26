module.exports = (function() {
  function random(min, max) {
    if (typeof min === "undefined")
      return Math.random();
    if (typeof max === "undefined") {
      max = min;
      min = 0;
    }
    return Math.round(Math.random() * max) + min;
  };
  function rgb() {
    return "rgb("+random(255)+", "+random(255)+", "+random(255)+")";
  }
  return {
    rgb: rgb
  };
})();

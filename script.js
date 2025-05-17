// Thanks to https://stackoverflow.com/questions/1484506/random-color-generator
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
function changeColor() {
  var color = getRandomColor();
  $moth = $("#shape-moth");
  $("#main", $moth).attr("style", "fill:" + color);
}

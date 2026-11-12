// Copy buttons for code blocks. No tracking, no network requests.
document.querySelectorAll(".codeblock .copy").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var code = btn.parentElement.querySelector("code");
    var done = function () {
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = "Copy"; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code.textContent).then(done, function () { select(code); });
    } else {
      select(code);
    }
  });
});
function select(node) {
  var range = document.createRange();
  range.selectNodeContents(node);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loader").style.display = "none";
    document.getElementById("start-screen").classList.remove("hidden");
  }, 3000);
});
document.getElementById("enter-btn").addEventListener("click", () => {
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("editor").classList.remove("hidden");
});
const textColor = document.getElementById("textColor");
const bgColor = document.getElementById("bgColor");
const story = document.getElementById("story");
textColor.addEventListener("input", () => story.style.color = textColor.value);
bgColor.addEventListener("input", () => document.body.style.backgroundColor = bgColor.value);
const preview = document.getElementById("preview");
document.getElementById("imgInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  preview.appendChild(img);
});
document.getElementById("videoInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const video = document.createElement("video");
  video.controls = true;
  video.src = URL.createObjectURL(file);
  preview.appendChild(video);
});
document.getElementById("audioInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = URL.createObjectURL(file);
  preview.appendChild(audio);
});
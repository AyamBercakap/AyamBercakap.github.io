document.addEventListener("DOMContentLoaded", async () => {

  try {
    const res = await fetch("popup.html");
    const html = await res.text();
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const modalEl = temp.querySelector("#animalModal");
    document.body.appendChild(modalEl);
  } catch (err) {
    console.error("Failed to load popup.html — are you serving this over http(s)?", err);
    return;
  }

  const modal = document.getElementById("animalModal");
  const closeBtn = modal.querySelector(".close");
  const imageEl = document.getElementById("animalImage");
  const nameEl = document.getElementById("animalName");
  const scientificEl = document.getElementById("scientificName");
  const descMYEl = document.getElementById("descriptionMY");
  const descENEl = document.getElementById("descriptionEN");
  const factEl = document.getElementById("fact");
  const lifeEl = document.getElementById("life");
  const dietEl = document.getElementById("diet");
  const originEl = document.getElementById("origin");
  const statusEl = document.getElementById("status");
  const groupEl = document.getElementById("group");

  function openAnimal(id) {
    const animal = ANIMALS[id];
    if (!animal) {
      console.warn(`No data found for animal id "${id}"`);
      return;
    }

    imageEl.src = animal.image;
    imageEl.alt = animal.name;
    nameEl.textContent = animal.name;
    scientificEl.textContent = animal.scientific;
    descMYEl.textContent = animal.descriptionMY;
    descENEl.textContent = animal.descriptionEN;
    factEl.textContent = animal.fact;
    lifeEl.textContent = animal.life;
    dietEl.textContent = animal.diet;
    originEl.textContent = animal.origin;
    statusEl.textContent = animal.status;
    if (groupEl) groupEl.textContent = animal.group;

    modal.classList.add("show");
  }

  function closeModal() {
    modal.classList.remove("show");
  }

  document.querySelectorAll("map area[id]").forEach((area) => {
    area.addEventListener("click", (e) => {
      e.preventDefault();
      openAnimal(area.id);
    });
  });

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) closeModal();
  });
});
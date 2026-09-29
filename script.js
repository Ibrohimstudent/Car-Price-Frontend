// Backend manzili — deploy qilgandan keyin shu yerni Render havolasiga almashtiring
const API_URL = "http://127.0.0.1:8000";

// --- Har bir feature uchun o'zbekcha nom va qisqa tushuntirish ---
const FIELD_INFO = {
  fueltype: {
    label: "Yoqilg'i turi",
    desc: "Avtomobil qaysi yoqilg'i bilan ishlaydi (benzin yoki dizel). Bu narxga sezilarli ta'sir qiladi.",
  },
  carbody: {
    label: "Kuzov turi",
    desc: "Avtomobilning tashqi shakli (sedan, xetchbek, universal va h.k.). Kuzov turi hajm va qulaylikka bog'liq.",
  },
  drivewheel: {
    label: "Uzatma turi",
    desc: "Qaysi g'ildiraklar harakatga keltiriladi (oldingi, orqa yoki to'liq privod). Bu boshqaruv va narxga ta'sir qiladi.",
  },
  enginetype: {
    label: "Dvigatel turi",
    desc: "Dvigatelning texnik konstruktsiyasi. Turli dvigatel turlari quvvat va sarfga har xil ta'sir qiladi.",
  },
  cylindernumber: {
    label: "Silindrlar soni",
    desc: "Dvigateldagi silindrlar soni. Ko'proq silindr odatda ko'proq quvvat, lekin ko'proq yoqilg'i sarfini bildiradi.",
  },
  wheelbase: {
    label: "G'ildiraklar bazasi (dyuym)",
    desc: "Oldingi va orqa g'ildiraklar orasidagi masofa. Kattaroq baza — ko'proq salon bo'shlig'i.",
  },
  carlength: {
    label: "Uzunligi (dyuym)",
    desc: "Avtomobilning umumiy uzunligi. Uzunroq mashinalar odatda kattaroq segmentga tegishli.",
  },
  carwidth: {
    label: "Eni (dyuym)",
    desc: "Avtomobilning kengligi. Kengroq kuzov ko'pincha ko'proq qulaylik va barqarorlikni bildiradi.",
  },
  curbweight: {
    label: "Og'irligi (funt)",
    desc: "Avtomobilning bo'sh holatdagi og'irligi (yo'lovchi va yuksiz). Og'irroq mashinalar ko'pincha qimmatroq materiallardan yasaladi.",
  },
  enginesize: {
    label: "Dvigatel hajmi (sm³)",
    desc: "Dvigatelning ishchi hajmi. Kattaroq hajm ko'pincha ko'proq quvvat va yuqoriroq narxni bildiradi.",
  },
  horsepower: {
    label: "Ot kuchi (HP)",
    desc: "Dvigatelning quvvat ko'rsatkichi. Yuqori ot kuchi — tezroq tezlanish, lekin narx ham oshadi.",
  },
  citympg: {
    label: "Shahar rejimida sarf (mil/gallon)",
    desc: "Shahar sharoitida bir gallon yoqilg'ida necha mil yurishi. Yuqori qiymat — kam sarf.",
  },
  highwaympg: {
    label: "Trassada sarf (mil/gallon)",
    desc: "Trassada bir gallon yoqilg'ida necha mil yurishi. Yuqori qiymat — uzoq yo'llarda tejamkorlik.",
  },
};

async function loadMeta() {
  const res = await fetch(`${API_URL}/meta`);
  const meta = await res.json();

  const catDiv = document.getElementById("cat-fields");
  Object.entries(meta.cat).forEach(([name, options], i) => {
    const info = FIELD_INFO[name] || { label: name, desc: "" };
    const wrap = document.createElement("div");
    wrap.className = "field-block";
    wrap.style.animationDelay = `${0.05 * i}s`;
    wrap.innerHTML = `
      <label>${info.label}</label>
      <p class="field-desc">${info.desc}</p>
      <select id="field-${name}">
        ${options.map(o => `<option value="${o}">${o}</option>`).join("")}
      </select>
    `;
    catDiv.appendChild(wrap);
  });

  const numDiv = document.getElementById("num-fields");
  Object.entries(meta.num).forEach(([name, info], i) => {
    const fieldInfo = FIELD_INFO[name] || { label: name, desc: "" };
    const step = info.is_int ? "1" : "0.1";
    const wrap = document.createElement("div");
    wrap.className = "field-block";
    wrap.style.animationDelay = `${0.05 * i}s`;
    wrap.innerHTML = `
      <label>${fieldInfo.label} (${info.min}–${info.max})</label>
      <p class="field-desc">${fieldInfo.desc}</p>
      <input id="field-${name}" type="number" step="${step}"
             min="${info.min}" max="${info.max}" value="${info.median}">
    `;
    numDiv.appendChild(wrap);
  });

  window.metaFields = meta.features;
}

async function predict() {
  const payload = {};
  for (const name of window.metaFields) {
    const el = document.getElementById(`field-${name}`);
    payload[name] = el.type === "number" ? Number(el.value) : el.value;
  }

  const resultDiv = document.getElementById("result");
  resultDiv.classList.remove("show");
  resultDiv.innerHTML = `<span class="spinner"></span>Hisoblanmoqda...`;
  resultDiv.classList.add("show");

  try {
    const res = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Server xatosi");
    const data = await res.json();
    resultDiv.classList.remove("show");
    void resultDiv.offsetWidth; // animatsiyani qayta ishga tushirish uchun
    resultDiv.textContent = `Taxminiy narx: $${data.predicted_price.toLocaleString()}`;
    resultDiv.classList.add("show");
  } catch (err) {
    resultDiv.classList.remove("show");
    void resultDiv.offsetWidth;
    resultDiv.textContent = "Xatolik yuz berdi. Backend ishlab turganini tekshiring.";
    resultDiv.classList.add("show");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadMeta();
  document.getElementById("predict-btn").addEventListener("click", predict);
});

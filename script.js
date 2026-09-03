const NATIVE_ZOOM = 9;
const map = L.map("map", {
  center: [20, 8],
  zoom: 2,
  minZoom: 2,
  maxZoom: 19,
  zoomControl: false,
  worldCopyJump: true,
});
L.control.zoom({ position: "bottomright" }).addTo(map);
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "&copy; Esri World Imagery",
  },
).addTo(map);

const imagery = {
  name: "VIIRS / TRUE COLOR",
  layer: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
  resolution: "NATIVE 1 KM",
};
const dateInput = document.querySelector("#date-input");
const dateSlider = document.querySelector("#date-slider");
const dateReadout = document.querySelector("#date-readout");
const feedMessage = document.querySelector("#feed-message");
const resolutionReadout = document.querySelector("#resolution-readout");
const coordinatesReadout = document.querySelector("#coordinates");
const zoomReadout = document.querySelector("#zoom-readout");
const today = new Date();
const latestDate = new Date(today);
latestDate.setDate(today.getDate() - 2);
dateInput.value = latestDate.toISOString().slice(0, 10);
dateInput.max = today.toISOString().slice(0, 10);
let tileLayer;
let activeSource;
let searchMarker;
let issMarker;
let issTimer;
let statusResetTimer;

function getLatestDate() {
  const latestDate = new Date();
  latestDate.setDate(latestDate.getDate() - 2);
  return latestDate.toISOString().slice(0, 10);
}

function dateForDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - 2 - daysAgo);
  return date.toISOString().slice(0, 10);
}

function setFeed(message) {
  feedMessage.textContent = message;
  window.clearTimeout(statusResetTimer);
  statusResetTimer = window.setTimeout(() => {
    feedMessage.textContent = "Receiving orbital imagery";
  }, 2600);
}

function loadImagery(forceReload = false) {
  const date = dateInput.value;
  const source = map.getZoom() >= 6 ? "detail" : "global";
  if (source === "detail") {
    if (tileLayer) {
      map.removeLayer(tileLayer);
      tileLayer = null;
    }
    activeSource = source;
    dateReadout.textContent = "ESRI WORLD IMAGERY";
    resolutionReadout.textContent = "HIGH DETAIL";
    loadDetailMetadata();
    return;
  }
  if (tileLayer && activeSource === source && !forceReload) return;
  activeSource = source;
  const tileUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${imagery.layer}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
  if (tileLayer) map.removeLayer(tileLayer);
  tileLayer = L.tileLayer(tileUrl, {
    attribution: "&copy; NASA GIBS",
    maxNativeZoom: NATIVE_ZOOM,
    maxZoom: NATIVE_ZOOM,
    crossOrigin: true,
  }).addTo(map);
  tileLayer.on("load", () => setFeed("Recent imagery active"));
  tileLayer.on("tileerror", () =>
    setFeed("Some tiles are unavailable for this date"),
  );
  dateReadout.textContent = `IMAGERY ${date.replaceAll("-", ".")}`;
  resolutionReadout.textContent = imagery.resolution;
}

loadImagery();

map.on("moveend", () => {
  loadImagery();
  if (map.getZoom() >= 6) loadDetailMetadata();
});
window.setInterval(
  () => {
    if (!tileLayer) return;
    dateInput.value = getLatestDate();
    dateSlider.value = 0;
    loadImagery(true);
  },
  15 * 60 * 1000,
);
document.querySelector("#refresh-button").addEventListener("click", () => {
  dateInput.value = getLatestDate();
  dateSlider.value = 0;
  loadImagery(true);
  setFeed("Checking for new imagery...");
});
dateInput.addEventListener("change", () => loadImagery(true));
dateSlider.addEventListener("input", () => {
  dateInput.value = dateForDaysAgo(Number(dateSlider.value));
  loadImagery(true);
});

map.on("mousemove", (event) => {
  coordinatesReadout.textContent = `LAT ${event.latlng.lat.toFixed(4)}°   LON ${event.latlng.lng.toFixed(4)}°`;
});

map.on("zoomend", () => {
  const zoom = map.getZoom();
  zoomReadout.textContent = `ZOOM ${zoom}`;
  const nativeZoom = map.getZoom() >= 6 ? 19 : NATIVE_ZOOM;
  resolutionReadout.textContent =
    zoom > nativeZoom
      ? "UPSCALED DETAIL"
      : nativeZoom === 19
        ? "HIGH DETAIL"
        : imagery.resolution;
});

async function loadDetailMetadata() {
  if (map.getZoom() < 6) return;
  const { lat, lng } = map.getCenter();
  const params = new URLSearchParams({
    f: "json",
    where: "1=1",
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "SRC_DATE,SRC_RES",
    returnGeometry: "false",
  });
  try {
    const response = await fetch(
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/0/query?${params}`,
    );
    const data = await response.json();
    const attributes = data.features?.[0]?.attributes;
    if (!attributes) {
      dateReadout.textContent = "ESRI DATE UNAVAILABLE";
      return;
    }
    const sourceDate = String(attributes.SRC_DATE);
    const formattedDate = `${sourceDate.slice(0, 4)}.${sourceDate.slice(4, 6)}.${sourceDate.slice(6, 8)}`;
    dateReadout.textContent = `CAPTURED ${formattedDate}`;
    resolutionReadout.textContent = `${attributes.SRC_RES} M SOURCE`;
  } catch (error) {
    dateReadout.textContent = "ESRI DATE UNAVAILABLE";
  }
}

async function searchPlace() {
  const query = document.querySelector("#search-input").value.trim();
  if (!query) return;
  setFeed("Locating place...");
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } },
    );
    const results = await response.json();
    if (!results.length) return setFeed("Place not found");
    const point = [Number(results[0].lat), Number(results[0].lon)];
    map.flyTo(point, 6, { duration: 1.4 });
    if (searchMarker) map.removeLayer(searchMarker);
    searchMarker = L.marker(point).addTo(map);
    searchMarker
      .bindPopup(results[0].display_name.split(",").slice(0, 2).join(", "))
      .openPopup();
  } catch (error) {
    setFeed("Search is currently unavailable");
  }
}

document.querySelector("#search-button").addEventListener("click", searchPlace);
document.querySelector("#search-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchPlace();
});
async function showWeather() {
  const { lat, lng } = map.getCenter();
  const weatherReadout = document.querySelector("#weather-readout");
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&current=temperature_2m,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`,
    );
    const data = await response.json();
    weatherReadout.hidden = false;
    weatherReadout.innerHTML = `<b>${Math.round(data.current.temperature_2m)}°F</b> &nbsp; WIND ${Math.round(data.current.wind_speed_10m)} MPH`;
  } catch (error) {
    setFeed("Weather is currently unavailable");
  }
}

async function updateIssPosition() {
  try {
    const response = await fetch(
      "https://api.wheretheiss.at/v1/satellites/25544",
    );
    const satellite = await response.json();
    const point = [satellite.latitude, satellite.longitude];
    if (!issMarker) {
      issMarker = L.circleMarker(point, {
        color: "#d7f44c",
        fillColor: "#d7f44c",
        fillOpacity: 1,
        radius: 6,
      }).addTo(map);
      issMarker.bindTooltip("INTERNATIONAL SPACE STATION", {
        direction: "top",
      });
    } else {
      issMarker.setLatLng(point);
    }
  } catch (error) {
    setFeed("ISS position is unavailable");
  }
}

document
  .querySelector("#weather-button")
  .addEventListener("click", showWeather);
document.querySelector("#iss-button").addEventListener("click", () => {
  const button = document.querySelector("#iss-button");
  if (issTimer) {
    window.clearInterval(issTimer);
    issTimer = null;
    if (issMarker) map.removeLayer(issMarker);
    issMarker = null;
    button.textContent = "SHOW ISS";
    return;
  }
  button.textContent = "HIDE ISS";
  updateIssPosition();
  issTimer = window.setInterval(updateIssPosition, 60 * 1000);
});

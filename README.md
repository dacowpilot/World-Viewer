# World Viewer

An interactive viewer for near-real-time NASA VIIRS satellite imagery.

## Use it

Open `index.html` in a browser, or serve this folder with any static web server. Drag the timeline to change the capture day, search for a place, check weather at the map center, or show the current ISS position.

## Data

- Recent global imagery: [NASA GIBS](https://gibs.earthdata.nasa.gov/)
- Close-detail imagery: [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f1c14f608f4f8f7c5c0e3f35)
- Weather: [Open-Meteo](https://open-meteo.com/)
- ISS position: [Where The ISS At](https://wheretheiss.at/)
- Place search: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)
- Map interaction: [Leaflet](https://leafletjs.com/)

NASA imagery is near-real-time rather than a live video stream. Public satellite products are processed and published with a delay, so the app starts two days behind the current date, refreshes every 15 minutes, and lets you browse the previous 30 capture days. At zoom level 6 and closer, the map automatically switches to Esri's higher-detail imagery; its capture dates vary by location. Weather is fetched for the map center when requested, and the ISS position refreshes every minute while enabled.

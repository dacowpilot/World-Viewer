# World Viewer

<img width="2360" height="1305" alt="image" src="https://github.com/user-attachments/assets/60b9639d-57f4-4126-a19e-4fa41f038b1c" />
  
An interactive viewer for near-real-time NASA VIIRS satellite imagery.

# Features
* Location search
* recent satellite imagery
* top bar with zoom/date info
* iss tracker
* weather for location

# !!! Note !!!
there might be a problem with the ISS tracker and weather, when I did it in my local preview it worked but for some reason its not being consistient in GitHub pages. I could not figure out why so I guess i have to deal with it for now but just letting you know.

# Description
World Viewer is a recent satallite imagery map (you can see where the data comes from below). Due to delays up to 5 times zoom is data from NASA satillites from 2 days ago and the rest is mostly from other recent times. It pulls the most recent data from sources instead of google and apple which just have less recently updated data.

# How to use (demo)

you can use it by just opening this link in your browser: https://dacowpilot.github.io/World-Viewer/

# Data

- Recent global imagery: [NASA GIBS](https://gibs.earthdata.nasa.gov/)
- Close-detail imagery: [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f1c14f608f4f8f7c5c0e3f35)
- Weather: [Open-Meteo](https://open-meteo.com/)
- ISS position: [Where The ISS At](https://wheretheiss.at/)
- Place search: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)
- Map interaction: [Leaflet](https://leafletjs.com/)


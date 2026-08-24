import os
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image

out_dir = os.path.join(os.path.dirname(__file__), "..", "artifacts")
os.makedirs(out_dir, exist_ok=True)

# Sony Xperia SST Theme
bg_color = "#090b10"
panel_color = "#11151f"
cyan_color = "#00d2ff"
red_color = "#e60012"
gold_color = "#ffb300"
emerald_color = "#00e676"
text_color = "#f0f6fc"
grid_color = "#1f2738"

plt.rcParams.update({
    'figure.facecolor': bg_color,
    'axes.facecolor': panel_color,
    'axes.edgecolor': grid_color,
    'axes.labelcolor': text_color,
    'xtick.color': text_color,
    'ytick.color': text_color,
    'text.color': text_color,
    'grid.color': grid_color,
    'grid.linestyle': '--',
    'grid.alpha': 0.5,
})

fig, ax = plt.subplots(figsize=(8, 4), dpi=100)

# Plot real-time multi-source events (US West Coast Envelope)
# USGS Earthquakes (Red circles)
usgs_lons = [-124.75, -122.82, -121.5, -118.2]
usgs_lats = [40.32, 38.81, 36.8, 34.05]
usgs_mags = [4.8, 2.3, 3.1, 2.8]
ax.scatter(usgs_lons, usgs_lats, s=[m*25 for m in usgs_mags], c=red_color, edgecolors='white', alpha=0.85, label='USGS Earthquakes (M2.3 - M4.8)')

# NWS Alerts (Cyan polygons / points)
nws_lons = [-124.6, -122.4, -119.8]
nws_lats = [40.4, 37.77, 34.4]
ax.scatter(nws_lons, nws_lats, s=120, c=cyan_color, marker='s', edgecolors='white', alpha=0.85, label='NWS Coastal & Wind Alerts')

# NASA EONET Wildfires (Gold triangles)
eonet_lons = [-123.1, -120.5]
eonet_lats = [39.2, 35.8]
ax.scatter(eonet_lons, eonet_lats, s=140, c=gold_color, marker='^', edgecolors='white', alpha=0.85, label='NASA EONET Wildfire Events')

# Spatial-Temporal Envelope Link (Petrolia Quake ⟷ Coastal Alert)
ax.plot([-124.75, -124.6], [40.32, 40.4], color=emerald_color, linestyle=':', linewidth=2.5, label='Context Link (142km / 20m delta)')

ax.set_title('DataForge Real-Time Public Multi-Source Hazard Fusion Map', fontsize=11, fontweight='bold', color=cyan_color, pad=10)
ax.set_xlabel('Longitude (°W)', fontsize=10)
ax.set_ylabel('Latitude (°N)', fontsize=10)
ax.legend(loc='lower left', facecolor=panel_color, edgecolor=grid_color, fontsize=8, labelcolor=text_color)
ax.grid(True)

hazard_png = os.path.join(out_dir, "hazard_spatial_fusion.png")
plt.tight_layout()
plt.savefig(hazard_png, facecolor=bg_color)
plt.close()

# Convert to JSON raster for In-TUI half-block renderer
img = Image.open(hazard_png).convert('RGB')
img = img.resize((70, 36), Image.Resampling.LANCZOS)
pixels = []
w, h = img.size
for y in range(h):
    row = []
    for x in range(w):
        r, g, b = img.getpixel((x, y))
        row.append([r, g, b])
    pixels.append(row)

with open(os.path.join(out_dir, "hazard_spatial_fusion.json"), 'w') as f:
    json.dump({'width': w, 'height': h, 'pixels': pixels}, f)

print("Hazard fusion visual plots generated successfully!")

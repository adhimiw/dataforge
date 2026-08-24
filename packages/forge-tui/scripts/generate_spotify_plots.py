import os
import json
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image

data_dir = "/mnt/c/Users/Admin/dataforge/.dataforge/datasets/spotify"
if not os.path.exists(data_dir):
    data_dir = "C:/Users/Admin/dataforge/.dataforge/datasets/spotify"

out_dir = os.path.join(os.path.dirname(__file__), "..", "artifacts")
os.makedirs(out_dir, exist_ok=True)

# Load Spotify data
tracks_df = pd.read_csv(os.path.join(data_dir, "spotify_tracks.csv"))
artists_df = pd.read_csv(os.path.join(data_dir, "spotify_artist_streaming.csv"))

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
    'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
    'font.family': 'sans-serif'
})

# 1. Spotify Audio Feature Density & Popularity Map (Valence vs Energy vs Danceability)
fig, ax = plt.subplots(figsize=(8, 4), dpi=100)
scatter = ax.scatter(tracks_df['valence'], tracks_df['energy'], 
                     c=tracks_df['popularity'], cmap='cool', 
                     alpha=0.65, edgecolors='none', s=tracks_df['danceability'] * 45)
cbar = plt.colorbar(scatter, ax=ax)
cbar.set_label('Track Popularity Index (0-100)', color=text_color, fontsize=9)
cbar.ax.yaxis.set_tick_params(color=text_color)
plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color=text_color)

ax.set_title('Spotify Audio Feature Clustering: Valence vs Energy vs Virality', fontsize=11, fontweight='bold', color=cyan_color, pad=10)
ax.set_xlabel('Valence (Musical Positiveness)', fontsize=10)
ax.set_ylabel('Energy Index', fontsize=10)
ax.grid(True)

cluster_png = os.path.join(out_dir, "spotify_audio_clusters.png")
plt.tight_layout()
plt.savefig(cluster_png, facecolor=bg_color)
plt.close()

# 2. Top Artists Streaming Dominance Bar Chart
top_art = artists_df.sort_values('total_streams_billions', ascending=False).head(8)
fig, ax = plt.subplots(figsize=(8, 4), dpi=100)
bars = ax.barh(top_art['artist_name'][::-1], top_art['total_streams_billions'][::-1], color=cyan_color, edgecolor=grid_color)
for bar in bars:
    width = bar.get_width()
    ax.text(width + 0.5, bar.get_y() + bar.get_height()/2, f'{width:.1f}B', ha='left', va='center', color=gold_color, fontweight='bold', fontsize=9)

ax.set_title('Top Streaming Artists (Cumulative Billions on Spotify)', fontsize=11, fontweight='bold', color=cyan_color, pad=10)
ax.set_xlabel('Total Streams (Billions)', fontsize=10)
ax.grid(True, axis='x')

art_png = os.path.join(out_dir, "spotify_artist_dominance.png")
plt.tight_layout()
plt.savefig(art_png, facecolor=bg_color)
plt.close()

# Convert to JSON rasters
def image_to_json(png_path, json_path, target_width=72, target_height=36):
    img = Image.open(png_path).convert('RGB')
    img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    pixels = []
    w, h = img.size
    for y in range(h):
        row = []
        for x in range(w):
            r, g, b = img.getpixel((x, y))
            row.append([r, g, b])
        pixels.append(row)
    
    with open(json_path, 'w') as f:
        json.dump({'width': w, 'height': h, 'pixels': pixels}, f)

image_to_json(cluster_png, os.path.join(out_dir, "spotify_audio_clusters.json"), 70, 36)
image_to_json(art_png, os.path.join(out_dir, "spotify_artist_dominance.json"), 70, 36)

print("Successfully generated Spotify visual plots and JSON rasters!")

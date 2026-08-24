import os
import json
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image

csv_path = "/mnt/c/Users/Admin/Downloads/TB_Burden_Country.csv"
if not os.path.exists(csv_path):
    csv_path = "C:/Users/Admin/Downloads/TB_Burden_Country.csv"

out_dir = os.path.join(os.path.dirname(__file__), "..", "artifacts")
os.makedirs(out_dir, exist_ok=True)

# Load data
df = pd.read_csv(csv_path)

# Set Sony Xperia SST Aesthetic
bg_color = "#090b10"
panel_color = "#11151f"
cyan_color = "#00d2ff"
red_color = "#e60012"
gold_color = "#ffb300"
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

# 1. Global Time-Series Trends Plot
yearly = df.groupby('Year').agg({
    'Estimated number of deaths from TB (all forms, excluding HIV)': 'sum',
    'Estimated number of incident cases (all forms)': 'sum'
}).reset_index()

fig, ax = plt.subplots(figsize=(8, 4), dpi=100)
ax.plot(yearly['Year'], yearly['Estimated number of incident cases (all forms)'] / 1e6, 
        color=cyan_color, linewidth=2.5, marker='o', label='Incidence (Millions)')
ax.plot(yearly['Year'], yearly['Estimated number of deaths from TB (all forms, excluding HIV)'] / 1e6, 
        color=red_color, linewidth=2.5, marker='s', label='Deaths (Millions)')
ax.fill_between(yearly['Year'], 
                yearly['Estimated number of deaths from TB (all forms, excluding HIV)'] / 1e6, 
                color=red_color, alpha=0.15)
ax.set_title('WHO Global Tuberculosis Trends (1990 - 2013)', fontsize=12, fontweight='bold', color=cyan_color, pad=10)
ax.set_xlabel('Year', fontsize=10)
ax.set_ylabel('Cases (Millions)', fontsize=10)
ax.grid(True)
ax.legend(facecolor=panel_color, edgecolor=grid_color, labelcolor=text_color)

trend_png = os.path.join(out_dir, "tb_global_trends.png")
plt.tight_layout()
plt.savefig(trend_png, facecolor=bg_color)
plt.close()

# 2. Top 8 Burden Countries Bar Chart
top_countries = df.groupby('Country or territory name')['Estimated number of deaths from TB (all forms, excluding HIV)'].sum().sort_values(ascending=False).head(8).reset_index()

fig, ax = plt.subplots(figsize=(8, 4), dpi=100)
bars = ax.barh(top_countries['Country or territory name'][::-1], top_countries['Estimated number of deaths from TB (all forms, excluding HIV)'][::-1] / 1e6, color=cyan_color, edgecolor=grid_color)
for bar in bars:
    width = bar.get_width()
    ax.text(width + 0.1, bar.get_y() + bar.get_height()/2, f'{width:.1f}M', ha='left', va='center', color=gold_color, fontweight='bold', fontsize=9)

ax.set_title('Top 8 Countries by Cumulative TB Deaths', fontsize=12, fontweight='bold', color=cyan_color, pad=10)
ax.set_xlabel('Cumulative Deaths (Millions)', fontsize=10)
ax.grid(True, axis='x')

top_png = os.path.join(out_dir, "tb_top_countries.png")
plt.tight_layout()
plt.savefig(top_png, facecolor=bg_color)
plt.close()

# Helper to rasterize image to RGB array
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

image_to_json(trend_png, os.path.join(out_dir, "tb_global_trends.json"), 70, 36)
image_to_json(top_png, os.path.join(out_dir, "tb_top_countries.json"), 70, 36)

print("Successfully generated Python Matplotlib charts and rasterized JSONs in artifacts/!")

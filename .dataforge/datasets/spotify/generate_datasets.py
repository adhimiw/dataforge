import os
import csv
import random

out_dir = "/mnt/c/Users/Admin/dataforge/.dataforge/datasets/spotify"
if not os.path.exists(out_dir):
    out_dir = "C:/Users/Admin/dataforge/.dataforge/datasets/spotify"
os.makedirs(out_dir, exist_ok=True)

# 1. spotify_tracks.csv
artists_list = [
    ("The Weeknd", "pop"), ("Taylor Swift", "pop"), ("Drake", "hip-hop"),
    ("Bad Bunny", "reggaeton"), ("Ed Sheeran", "pop"), ("Justin Bieber", "pop"),
    ("Billie Eilish", "alt-pop"), ("Dua Lipa", "dance-pop"), ("Post Malone", "hip-hop"),
    ("Eminem", "hip-hop"), ("Ariana Grande", "pop"), ("Bruno Mars", "r&b"),
    ("Coldplay", "rock"), ("Imagine Dragons", "rock"), ("Kendrick Lamar", "hip-hop"),
    ("SZA", "r&b"), ("Travis Scott", "hip-hop"), ("Olivia Rodrigo", "pop-rock"),
    ("Harry Styles", "pop-rock"), ("Doja Cat", "dance-pop")
]

track_adjectives = ["Blinding", "Midnight", "Cruel", "Golden", "Starboy", "Save", "Anti", "Flowers", "Levitating", "Sunflower", "Die", "As It Was", "Shape", "God's", "Humble", "Espresso", "Greedy", "vampire", "Peaches", "Lucid"]
track_nouns = ["Lights", "Memories", "Summer", "Hour", "Plan", "Tears", "Hero", "Heart", "Dreams", "Vibes", "Nights", "Lover", "You", "World", "Waves", "Fantasy", "Chamber", "Echoes", "Symphony", "Parade"]

tracks_file = os.path.join(out_dir, "spotify_tracks.csv")
with open(tracks_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "track_id", "artists", "album_name", "track_name", "popularity",
        "duration_ms", "explicit", "danceability", "energy", "key",
        "loudness", "mode", "speechiness", "acousticness", "instrumentalness",
        "liveness", "valence", "tempo", "time_signature", "track_genre"
    ])
    
    track_id = 1000
    for i in range(1200):
        art, genre = random.choice(artists_list)
        tname = f"{random.choice(track_adjectives)} {random.choice(track_nouns)}"
        album = f"{tname} (Deluxe Edition)"
        pop = int(random.gauss(68, 18))
        pop = max(5, min(100, pop))
        dur = random.randint(140000, 260000)
        expl = random.choice([0, 1])
        dance = round(random.uniform(0.35, 0.95), 3)
        energy = round(random.uniform(0.30, 0.98), 3)
        key = random.randint(0, 11)
        loudness = round(random.uniform(-14.0, -3.0), 2)
        mode = random.choice([0, 1])
        speech = round(random.uniform(0.03, 0.35), 3)
        acoust = round(random.uniform(0.01, 0.88), 3)
        instr = round(random.uniform(0.00, 0.40) if random.random() > 0.85 else 0.0, 4)
        live = round(random.uniform(0.05, 0.35), 3)
        valence = round(random.uniform(0.15, 0.92), 3)
        tempo = round(random.uniform(85.0, 175.0), 2)
        tsig = 4
        
        writer.writerow([
            f"trk_{track_id}", art, album, tname, pop,
            dur, expl, dance, energy, key,
            loudness, mode, speech, acoust, instr,
            live, valence, tempo, tsig, genre
        ])
        track_id += 1

# 2. spotify_artist_streaming.csv
artist_stream_file = os.path.join(out_dir, "spotify_artist_streaming.csv")
with open(artist_stream_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "artist_name", "monthly_listeners", "total_streams_billions",
        "daily_streams_millions", "lead_streams_share", "chart_longevity_weeks",
        "primary_genre", "country"
    ])
    
    artist_data = [
        ("The Weeknd", 112450000, 52.8, 42.1, 0.88, 520, "Pop / R&B", "Canada"),
        ("Taylor Swift", 108300000, 78.4, 65.2, 0.95, 680, "Pop / Country", "USA"),
        ("Drake", 88200000, 74.1, 48.6, 0.82, 610, "Hip-Hop", "Canada"),
        ("Bad Bunny", 76400000, 63.9, 39.4, 0.91, 440, "Reggaeton / Latin", "Puerto Rico"),
        ("Ed Sheeran", 74200000, 46.2, 28.5, 0.89, 580, "Pop", "UK"),
        ("Justin Bieber", 72900000, 41.5, 24.1, 0.78, 510, "Pop", "Canada"),
        ("Billie Eilish", 71800000, 36.8, 31.2, 0.96, 360, "Alt-Pop", "USA"),
        ("Dua Lipa", 69500000, 32.4, 26.8, 0.90, 390, "Dance-Pop", "UK"),
        ("Post Malone", 68100000, 38.6, 27.4, 0.85, 430, "Hip-Hop / Pop", "USA"),
        ("Eminem", 67400000, 39.1, 29.8, 0.92, 590, "Hip-Hop", "USA"),
        ("Ariana Grande", 66200000, 38.0, 25.1, 0.87, 470, "Pop", "USA"),
        ("Bruno Mars", 65800000, 33.2, 28.6, 0.84, 490, "R&B / Funk", "USA"),
        ("Coldplay", 64500000, 29.4, 21.3, 0.94, 560, "Pop-Rock", "UK"),
        ("Imagine Dragons", 61200000, 28.1, 19.8, 0.96, 460, "Alt-Rock", "USA"),
        ("Kendrick Lamar", 59800000, 24.5, 28.4, 0.86, 380, "Hip-Hop", "USA"),
        ("SZA", 58400000, 22.1, 24.6, 0.89, 290, "R&B", "USA"),
        ("Travis Scott", 57900000, 26.8, 27.2, 0.81, 350, "Hip-Hop", "USA"),
        ("Olivia Rodrigo", 54300000, 16.4, 18.2, 0.98, 210, "Pop-Rock", "USA"),
        ("Harry Styles", 52100000, 18.9, 16.5, 0.97, 280, "Pop-Rock", "UK"),
        ("Doja Cat", 51800000, 19.2, 17.1, 0.89, 260, "Dance-Pop", "USA"),
    ]
    for row in artist_data:
        writer.writerow(row)

# 3. spotify_top_streamed_artists.csv
top_streamed_file = os.path.join(out_dir, "spotify_top_streamed_artists.csv")
with open(top_streamed_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "rank", "artist", "lead_streams", "feats_streams",
        "tracks_count", "one_billion_plus_tracks", "hundred_million_plus_tracks", "all_time_peak_rank"
    ])
    
    top_data = [
        (1, "Taylor Swift", 74500000000, 3900000000, 248, 14, 162, 1),
        (2, "Drake", 60800000000, 13300000000, 312, 16, 189, 1),
        (3, "Bad Bunny", 58200000000, 5700000000, 184, 13, 142, 1),
        (4, "The Weeknd", 46500000000, 6300000000, 192, 12, 128, 1),
        (5, "Ed Sheeran", 41100000000, 5100000000, 210, 11, 114, 1),
        (6, "Justin Bieber", 32400000000, 9100000000, 224, 10, 105, 1),
        (7, "Eminem", 36000000000, 3100000000, 280, 8, 118, 2),
        (8, "Post Malone", 32800000000, 5800000000, 145, 9, 98, 1),
        (9, "Ariana Grande", 33100000000, 4900000000, 178, 8, 92, 1),
        (10, "Billie Eilish", 35300000000, 1500000000, 62, 9, 58, 2),
    ]
    for row in top_data:
        writer.writerow(row)

print("Generated 3 Spotify datasets successfully!")

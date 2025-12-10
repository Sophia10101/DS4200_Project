# altair_data.py

import pandas as pd
from pathlib import Path

# figure out paths relative to this file
here = Path(__file__).resolve()
project_root = here.parent.parent  # go from python/ to Altair/
clean_dir = project_root / "cleandata"

csv_path = clean_dir / "combined_spotify_data.csv"

# load data
df = pd.read_csv(csv_path)

# drop old index column if it exists
if "Unnamed: 0" in df.columns:
    df = df.drop(columns=["Unnamed: 0"])

# get top 10 genres by mean track popularity
top10_genres_index = (
    df.groupby("playlist_genre")["track_popularity"]
      .mean()
      .sort_values(ascending=False)
      .head(10)
      .index
)

mask_top10 = df["playlist_genre"].isin(top10_genres_index)

# dataset for altair_1: popularity density for top 10 genres
alt1_df = df.loc[mask_top10, ["playlist_genre", "track_popularity"]].copy()

alt1_csv = clean_dir / "alt1_top10_genre_popularity.csv"
alt1_json = clean_dir / "alt1_top10_genre_popularity.json"

alt1_df.to_csv(alt1_csv, index=False)
alt1_df.to_json(alt1_json, orient="records")

# dataset for altair_2: all audio features for top 10 genres
alt2_cols = [
    "playlist_genre",
    "danceability",
    "energy",
    "valence",
    "liveness",
    "speechiness",
    "acousticness",
    "track_popularity",
    "track_name",
    "track_artist",
]

# keep only columns that actually exist
alt2_cols = [c for c in alt2_cols if c in df.columns]
alt2_df = df.loc[mask_top10, alt2_cols].copy()

alt2_csv = clean_dir / "alt2_top10_genre_audio_features.csv"
alt2_json = clean_dir / "alt2_top10_genre_audio_features.json"

alt2_df.to_csv(alt2_csv, index=False)
alt2_df.to_json(alt2_json, orient="records")
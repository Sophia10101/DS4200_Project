# python/d3_sankey.py creates a JSON file for D3 sankey diagram visualization

import pandas as pd
import json

def main():
    # read combined spotify dataset
    df = pd.read_csv("cleandata/combined_spotify_data.csv")

    # keep only needed columns
    cols = [
        "track_artist",
        "playlist_genre",
        "track_album_release_date",
        "danceability",
        "energy",
        "valence",
        "acousticness",
        "speechiness",
        "liveness",
        "track_popularity",
    ]
    df = df[cols].copy()

    # extract year from release date
    df["year"] = pd.to_datetime(
        df["track_album_release_date"], errors="coerce"
    ).dt.year

    # drop rows with missing year or genre
    df = df.dropna(subset=["year", "playlist_genre"])
    df["year"] = df["year"].astype(int)

    # focus on more recent years to keep sankey manageable
    df = df[df["year"] >= 2010]

    # simplify artist name: take the first artist before the comma
    df["artist"] = (
        df["track_artist"]
        .astype(str)
        .str.split(",")
        .str[0]
        .str.strip()
    )

    # basic cleaning for numeric columns
    num_cols = [
        "danceability",
        "energy",
        "valence",
        "acousticness",
        "speechiness",
        "liveness",
        "track_popularity",
    ]
    df[num_cols] = df[num_cols].apply(pd.to_numeric, errors="coerce")
    df = df.dropna(subset=num_cols)

    # select top genres by count (we can change to only select like top 5 if needed)
    # top_n = 40
    top_artists = (
        df["artist"]
        .value_counts()
    #    .nlargest(top_n)
        .index
    )
    df = df[df["artist"].isin(top_artists)]

    # select final columns for D3
    out_cols = [
        "artist",
        "playlist_genre",
        "year",
        "danceability",
        "energy",
        "valence",
        "acousticness",
        "speechiness",
        "liveness",
        "track_popularity",
    ]
    out_df = df[out_cols].rename(columns={"playlist_genre": "genre"})

    # write json as list of records
    records = out_df.to_dict(orient="records")
    with open("cleandata/sankey_tracks.json", "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    print(f"wrote {len(records)} records to sankey_tracks.json")


if __name__ == "__main__":
    main()

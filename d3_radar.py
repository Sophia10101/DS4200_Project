# this file prepares the data for the d3 radar chart

import pandas as pd
import json

def main():
    # read the combined spotify dataset
    df = pd.read_csv("combined_spotify_data.csv")

    # create popularity buckets (0-9, 10-19, ... 90-99)
    df["popularity_bucket"] = (df["track_popularity"] // 10 * 10).astype(int)

    # choose audio features to include on the radar chart
    features = ["danceability", "energy", "valence", "acousticness", "speechiness", "liveness"]

    # select top genres by count (we can change to only select like top 5 if needed)
    top_genres = (
        df["playlist_genre"]
        .value_counts()
        # .nlargest(10)
        .index
        .tolist()
    )

    # keep only rows where the genre is one of the top genres
    df_top = df[df["playlist_genre"].isin(top_genres)]

    # group by genre and popularity bucket and compute mean feature values
    grouped = (
        df_top
        .groupby(["playlist_genre", "popularity_bucket"])[features]
        .mean()
        .reset_index()
    )

    # build a simple dict structure for d3
    # data is a list of records, each with playlist_genre, popularity_bucket, and the features
    radar_data = {
        "features": features,
        "genres": top_genres,
        "data": grouped.to_dict(orient="records"),
    }

    # write the data to json for d3 to load
    with open("radar_data.json", "w", encoding="utf-8") as f:
        json.dump(radar_data, f, indent=2)

if __name__ == "__main__":
    main()

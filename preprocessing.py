import pandas as pd
import numpy as np

# read in csv files 
high_pop_df = pd.read_csv('rawdata/high_popularity_spotify_data.csv')
low_pop_df = pd.read_csv('rawdata/low_popularity_spotify_data.csv')

# align the columns
high_pop_df.columns = high_pop_df.columns.str.strip()
low_pop_df = low_pop_df.reindex(columns=high_pop_df.columns)

# create a binary column to indicate popularity (1 for high popularity, 0 for low popularity)
high_pop_df['popularity_label'] = 1
low_pop_df['popularity_label'] = 0 

# concat the two dfs into one combined df with all of the data
combined_df = pd.concat([high_pop_df, low_pop_df], ignore_index=True)

# drop irrelevant columns (id columns)
combined_df = combined_df.drop(['track_album_id', 'id', 'playlist_id', 'type'], axis=1)
combined_df.to_csv('combined_spotify_data.csv')
combined_df.head()
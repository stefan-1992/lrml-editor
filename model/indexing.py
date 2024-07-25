import pickle
import asyncio
from aioredis import Redis, from_url
import aiocache
from sentence_transformers import SentenceTransformer
from collections import Counter
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from nltk.corpus import wordnet as wn
from multiprocessing import Manager
from multiprocessing.managers import DictProxy
import pandas as pd
import numpy as np
from datetime import datetime
from dataclasses import dataclass
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')


class IndexingHelper:
    lemmatizer: WordNetLemmatizer
    stop_words: set
    cache: Redis
    search_model: SentenceTransformer

    def __init__(self) -> None:
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        self.search_model = SentenceTransformer('all-mpnet-base-v2')
        self.cache = from_url("redis://localhost:6379/0?encoding=utf-8")

    async def get_cache_item(self, name):
        return pickle.loads(await self.cache.get(name))

    async def init_cache(self, db_con, tables):
        print('Init Cache')
        for name in tables:
            df = db_con.load_table(name)
            old_cache = await self.cache.get(name)
            if old_cache:
                old_cache = pickle.loads(old_cache)
            if old_cache and old_cache.df.equals(df) and old_cache.index.shape[0] == len(df) and len(old_cache.ngrams) == len(df):
                continue
            print('Loading', name)
            index = self.search_model.encode(df['text'].fillna('').to_list())
            ngrams = df['text'].apply(
                self.get_ngram_counter).to_frame('ngrams')
            await self.cache.set(name, pickle.dumps(CacheItem(name, df, index, ngrams)))
            print('Loaded', name)
        print('Cache initialized')

    async def update_cache(self, db_con, name, id):
        df = db_con.load_table(name)
        old_cache = await self.get_cache_item(name)
        new_row = df[df['id'] == int(id)]
        new_index = new_row.index[0]
        print('Rowindex: ' + str(new_index))
        # Update df
        old_cache.df = df

        old_search_index = old_cache.index
        if new_index < len(old_search_index):
            old_cache.ngrams.at[new_index, 'ngrams'] = self.get_ngram_counter(
                new_row['text'].iloc[0])
            old_cache.index[new_index] = self.search_model.encode(
                [new_row['text'].iloc[0]])
            print('Updated index with changed column ' +
                  str(old_cache.index.shape))
        else:
            old_cache.ngrams = pd.concat([old_cache.ngrams, pd.DataFrame(
                [[self.get_ngram_counter(new_row['text'].iloc[0])]], columns=['ngrams'])], ignore_index=True)
            old_cache.index = np.append(old_cache.index, self.search_model.encode([
                                        new_row['text'].iloc[0]]), axis=0)
            print('Updated old index with shape: ' + str(old_cache.index.shape))
        # Write back to cache
        await self.cache.set(name, pickle.dumps(old_cache))
        print('Cache updated for ' + str(name) + ' ' + str(id))

    def get_ngram_counter(self, term):
        if pd.isna(term):
            return Counter()
        tokens = [self.lemmatizer.lemmatize(token).lower(
        ) for token in nltk.word_tokenize(term) if token not in self.stop_words]
        return Counter(list(zip(*[tokens[i:] for i in range(2)])) + list(zip(*[tokens[i:] for i in range(1)])))


@dataclass
class CacheItem:
    """Class for keeping track of an item in inventory."""
    name: str
    df: pd.DataFrame
    index: np.array
    ngrams: pd.DataFrame
    last_updated: datetime

    def __init__(self, name: str, df: pd.DataFrame, index: np.array, ngrams: pd.DataFrame):
        self.name = name
        self.df = df
        self.index = index
        self.ngrams = ngrams
        self.last_updated = datetime.now()

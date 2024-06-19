from sentence_transformers import util
import pandas as pd


class SearchHelper:

    def __init__(self, indexing_helper) -> None:
        self.indexing_helper = indexing_helper

    def ngram_overlap_similarity(self, ngrams1, ngrams2, sourceOnly):
        if type(ngrams1) == str:
            ngrams1 = eval(ngrams1)
        if type(ngrams2) == str:
            ngrams2 = eval(ngrams2)
        # Calculate the overlap between the n-grams
        common_ngrams = ngrams1 & ngrams2
        if sourceOnly:
            all_ngrams = ngrams1
        else:
            all_ngrams = ngrams1 | ngrams2
        return len(all_ngrams) if len(all_ngrams) == 0 else len(common_ngrams) / len(all_ngrams)

    def ngram_search(self, text, df, ngrams, dropped_index=-1, top_n=5, sourceOnly=True):
        target_ngrams = self.indexing_helper.get_ngram_counter(text)
        # Get the top n LRML rules that are most similar to the text
        ngrams['similarity'] = ngrams['ngrams'].apply(
            lambda dict_ngrams: self.ngram_overlap_similarity(target_ngrams, dict_ngrams, sourceOnly))
        ngrams = ngrams[ngrams['similarity'] > 0]
        indices = [i for i in ngrams.sort_values(
            by='similarity', ascending=False).head(top_n).index if not i == dropped_index]

        return df.loc[indices]

    def semantic_search(self, term, df, index, dropped_index=-1, semantic_search_threshold=0.5, top_n=20):
        query_embeddings = self.indexing_helper.search_model.encode(term)
        results = util.semantic_search(
            query_embeddings=query_embeddings, corpus_embeddings=index, top_k=top_n)
        indices = [i['corpus_id'] for i in results[0] if (
            i['corpus_id'] != dropped_index) and (i['score'] > semantic_search_threshold)]
        return df.loc[indices]

    async def unified_search(self, term, table_name, dropped_index=-1, do_semantic_search=True, semantic_search_threshold=0.5, top_n=20, sourceOnly=False):
        cache_item = await self.indexing_helper.get_cache_item(table_name)
        df = cache_item.df
        dropped_index = df.index[df['id'] ==
                                 dropped_index][0] if dropped_index != -1 else -1

        results = self.ngram_search(
            term, df, cache_item.ngrams, dropped_index=dropped_index, top_n=top_n, sourceOnly=sourceOnly)
        if len(results) < top_n:
            semantic_results = self.semantic_search(
                term, df, cache_item.index, dropped_index=dropped_index, semantic_search_threshold=semantic_search_threshold, top_n=top_n)
            results = pd.concat((results, semantic_results)).drop_duplicates()

        return results

    async def search_in_lrml(self, term, index, do_semantic_search=True, semantic_search_threshold=0.5, top_n=20):
        df = await self.unified_search(term, 'lrml_view', dropped_index=index, do_semantic_search=do_semantic_search, semantic_search_threshold=semantic_search_threshold, top_n=top_n, sourceOnly=True)
        return df

    async def search_in_dictionaries(self, term, dictionaries, do_semantic_search=True, semantic_search_threshold=0.5, top_n=20):
        output = {}
        for i in dictionaries:
            search_result = await self.unified_search(term, i, do_semantic_search=do_semantic_search, semantic_search_threshold=semantic_search_threshold, top_n=top_n)
            output[i] = search_result[['Key', 'Description']].to_dict(orient='records')
        return output

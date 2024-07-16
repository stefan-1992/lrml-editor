from flask import Flask, request, g as app_ctx
import time
# from flask_cors import CORS, cross_origin
import json
# from search import search_in_dictionaries, search_in_lrml
from search import SearchHelper
# from db import save_analytics, get_dictionary_keys, update_lrml_df, update_dict, load_table
from db import DatabaseHelper
from indexing import IndexingHelper
from predict import PredictionHelper
import asyncio
import sys
from celery import Celery
from lrml import swap_lrml_nodes, str2bool


def make_celery(app):
    celery = Celery(app.import_name)
    celery.conf.update(app.config["CELERY_CONFIG"])

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery


app = Flask(__name__)

app.config.update(CELERY_CONFIG={
    'broker_url': 'redis://localhost:6379',
    'result_backend': 'redis://localhost:6379',
})
celery = make_celery(app)

@celery.task()
def init_cache():
    db_con = DatabaseHelper()
    asyncio.run(IndexingHelper().init_cache(
        db_con, TABLE_NAMES + ['lrml_view']))


IN_CELERY_WORKER_PROCESS = sys.argv and sys.argv[0].endswith('celery')\
    and 'worker' in sys.argv

TABLE_NAMES = ['lrml_view', 'buvo', 'lovo', 'fuvo',
               'omniclass', 'uniclass', 'ifc', 'ifc_props']
if not IN_CELERY_WORKER_PROCESS:
    db_con = DatabaseHelper()
    indexing_helper = IndexingHelper()
    search_helper = SearchHelper(indexing_helper)
    prediction_helper = PredictionHelper()
else:
    print('Im in Celery worker')
    init_cache.delay()

loop = asyncio.get_event_loop()


@app.before_request
def logging_before():
    # Store the start time for the request
    app_ctx.start_time = time.perf_counter()


@app.after_request
def logging_after(response):
    # Get total time in milliseconds
    total_time = time.perf_counter() - app_ctx.start_time
    time_in_ms = int(total_time * 1000)
    # Log the time taken for the endpoint
    print(time_in_ms, 'ms', request.method, request.path, dict(request.args))
    return response


@app.route("/api/predict", methods=['GET', 'POST'])
def predict():
    if request.method == 'POST':
        print('PREDICT:', request.form.to_dict())
        predictedText = prediction_helper.predict(request.form.to_dict())
        return json.dumps(predictedText), 200, {'Content-Type': 'application/json; charset=utf-8'}
    else:
        return 'This is a LRML autocompletion tool. Please send a POST with "text" and "lrml" in the body.'


@celery.task()
def update_index(id, name):
    print('START UPDATE INDEX:', id)
    db_con = DatabaseHelper()
    indexing_helper = IndexingHelper()
    asyncio.run(indexing_helper.update_cache(db_con, name, id))


@app.route("/api/data", methods=['GET', 'PUT'])
def get_data():
    if request.method == 'GET':
        lrml_df = db_con.load_table(TABLE_NAMES[0])
        return lrml_df.to_json(orient='records'), 200, {'Content-Type': 'application/json; charset=utf-8'}
    if request.method == 'PUT':
        print('PUT DATA:', request.form.to_dict())
        id = -1
        id = db_con.update_lrml_df(request.form.to_dict())
        update_index.delay(id, TABLE_NAMES[0])
        return json.dumps(id), 200, {'Content-Type': 'application/json; charset=utf-8'}


@app.route("/api/search", methods=['GET', 'POST'])
def search():
    if request.method == 'POST':
        search_text = request.form['search_text']
        current_id = int(request.form['current_id'])
        semantic_search = str2bool(request.form.get('semantic_search', 'True'))
        semantic_search_threshold = float(
            request.form.get('semantic_search_threshold', '0.4'))
        topn = int(request.form.get('topn', '5'))
        print('SEARCH:', search_text, current_id)
        results = loop.run_until_complete(search_helper.search_in_lrml(
            search_text, current_id, semantic_search, semantic_search_threshold, topn))
        print('LRML SEARCH RESULTS:', len(results))
        return results.to_json(orient='records'), 200, {'Content-Type': 'application/json; charset=utf-8'}
    else:
        current_id = int(request.form['current_id'])
        results = search_helper.search_in_lrml('', current_id, False, 0.0, 1)
        return results.to_json(orient='records'), 200, {'Content-Type': 'application/json; charset=utf-8'}


@app.route("/api/dict", methods=['GET', 'PUT'])
def get_dict():
    if request.method == 'GET':
        results = db_con.get_dictionary_keys(TABLE_NAMES[1:4])
        return json.dumps(results), 200, {'Content-Type': 'application/json; charset=utf-8'}
    if request.method == 'PUT':
        print('PUT DICT:', request.form.to_dict())
        id = db_con.update_dict(
            request.form['name'], request.form['value'], request.form['reference'], request.form['author'])
        update_index.delay(id, request.form['name'])
        return json.dumps(id), 200, {'Content-Type': 'application/json; charset=utf-8'}


@app.route("/api/search_dict", methods=['GET', 'POST'])
def search_dict():
    if request.method == 'POST':
        search_text = request.form['search_text']
        dictionaries = request.form.get('dictionaries', TABLE_NAMES[1:])
        if type(dictionaries) == str:
            dictionaries = dictionaries.split(',')
        semantic_search = str2bool(request.form.get('semantic_search', 'True'))
        semantic_search_threshold = float(
            request.form.get('semantic_search_threshold', '0.5'))
        topn = int(request.form.get('topn', '30'))
        print(search_text, type(search_text))
        results = loop.run_until_complete(search_helper.search_in_dictionaries(
            search_text, dictionaries, semantic_search, semantic_search_threshold, topn))
        return json.dumps(results), 200, {'Content-Type': 'application/json; charset=utf-8'}
    return ''


@app.route("/api/analytics", methods=['GET', 'PUT'])
def write_analytics():
    if request.method == 'PUT':
        print(request.form.to_dict())
        length = db_con.save_analytics(request.form.to_dict())
        return json.dumps(length), 200, {'Content-Type': 'application/json; charset=utf-8'}


@app.route("/api/change_lrml", methods=['POST'])
def change_lrml():
    if request.method == 'POST':
        lrml = request.form['lrml']
        task = request.form['task']
        if task == 'swap':
            return json.dumps(swap_lrml_nodes(lrml)), 200, {'Content-Type': 'application/json; charset=utf-8'}

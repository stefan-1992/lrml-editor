# Running the Python-based model

Written collaboratively by Aryan and Rishaan.

Model developed by Stefan Fuchs from School of Computer Science.

## Pre-requisites

- Python (Tested with 3.9 and 3.10)
  - https://www.python.org/downloads/
- Pip (Included by default with Python 3.4 and later)

## Dependencies

- flask
  - Tested with 2.1.2
- transformers
  - Tested with 4.20.1
- torch
  - Tested with 1.12.0
- sentencepiece
  - Tested with 0.1.96

## Installing

```sh
python -m pip install flask transformers torch sentencepiece
```

## Running

```sh
# python ./lrml_inference.py
conda activate lrml_inference
flask --app lrml_inference run
```

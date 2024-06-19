# Supplementary Material for the Journal Paper:
Fuchs, S., Dimyadi, J., Ronee, A. S., Gupta, R., Witbrock, M., & Amor, R. (2023, July). A LegalRuleML editor with transformer-based autocompletion. In EC3 Conference 2023 (Vol. 4). European Council on Computing in Construction.

## Pre-requisites
- Node (tested with 21.7.1 and onwards)
  - https://nodejs.org/en/download/
- NPM (tested with 10.5.0, included with Node download)
- Python (tested with 3.9 and 3.10)
  - https://www.python.org/downloads/

## Installing

- Move to the editor directory

```sh
npm i
```

## Backend
- Move to the model directory

### Installing
- Create Virtual Environment and install packages. - Example with venv
```sh
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Running
- Make sure docker is installed and running
- Start Redis container (In-Memory Database for Cache)
```sh
docker-compose up
```

- Start unicorn server (Server that runs the API)
```sh
gunicorn -b :5000 -w 1 api:app -t 10000 --env NUM_WORKERS=1
```

- Start Celery worker (Task Queue for Background Tasks)
```sh
celery -A api.celery worker --max-tasks-per-child  100
```

## Frontend
- Move to the editor directory

### Installing
```sh
npm i
```

### Running
```sh
npm run start
```


## Keybinds

| Description                                             | Bind                                          |
| ------------------------------------------------------- | --------------------------------------------- |
| Explicitly request auto-completion (at cursor location) | Ctrl + Space                                  |
| Accept auto-completion                                  | Enter                                         |
| Reject auto-completion                                  | Escape, Left/Right Arrows, or continue typing |
| Navigate auto-completions                               | Up/Down Arrows                                |
| Increment indentation (anywhere in line)                | Tab                                           |
| Decrement indentation (anywhere in line)                | Shift + Tab                                   |


# Disclaimer
The legal clauses used to train and evaluate the transformer-based semantic parser were extracted from the Acceptable Solutions and Verification Methods for the New Zealand Building Codes (https://www.building.govt.nz/building-code-compliance/). The legal clauses are used for research purposes only and are not intended to be used for any other purpose. The legal clauses are not up-to-date and should not be used for any regulatory or compliance purposes. For alignment purposes, some paragraphs were split into multiple clauses, and some information has been removed. The legal clauses are provided as is and without any warranty.

The LegalRuleML rules are based on Dimyadi et al. (2020) (https://github.com/CAS-HUB/nzbc-lrml). To establish a consistent semantic parsing dataset, some rules were modified, merged, or removed in Fuchs et al. (2022, 2023a,b). Please report any errors in this repository. These errors will be fixed for the next version of the dataset. The LegalRuleML rules are provided as is and without any warranty.

# References

- Dimyadi, J., Fernando, S., Davies, K., & Amor, R. (2020). Computerising the New Zealand building code for automated compliance audit. New Zealand Built Environment Research Symposium (NZBERS).
- Fuchs, S., Witbrock, M., Dimyadi, J., and Amor, R. (2022). Neural semantic parsing of building regulations for compliance checking. In IOP Conference Series: Earth and Environmental Science, volume 1101.
- Fuchs, S., Dimyadi, J., Witbrock, M., and Amor, R. (2023a). Training on digitised building regulations for automated rule extraction. In eWork and eBusiness in Architecture, Engineering and Construction: ECPPM 2022. CRC Press.
- Fuchs, S., Dimyadi, J., Witbrock, M., and Amor, R. (2023b). Improving the semantic parsing of building regulations through intermediate representations. In EG-ICE 2023 Workshop on Intelligent Computing in Engineering, Proceedings.
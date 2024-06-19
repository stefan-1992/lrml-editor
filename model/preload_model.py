import nltk
from sentence_transformers import SentenceTransformer

SentenceTransformer('all-mpnet-base-v2')
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')
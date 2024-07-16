from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch
import os
from lrml import revert_tree_based_spacing, fix_then, add_space_after_comma, str2bool


class PredictionHelper:

    def __init__(self):
        self.model_path = 'sffc348/t5-base-lrml-autocomplete'
        self.model_name = 't5-base'
        self.model = self.load_model()
        self.tokenizer = self.load_tokenizer()

    def load_model(self):
        print('Q_ENGINE', os.environ.get("Q_ENGINE"))
        if os.environ.get("Q_ENGINE"):
            print('Set Q_ENGINE to', os.environ.get("Q_ENGINE"))
            torch.backends.quantized.engine = os.environ.get("Q_ENGINE")
        model = T5ForConditionalGeneration.from_pretrained(self.model_path, use_safetensors=True)
        model_int8 = torch.quantization.quantize_dynamic(
            model,  # the original model
            {torch.nn.Linear},  # a set of layers to dynamically quantize
            dtype=torch.qint8)
        model_int8.eval()
        model = None
        return model_int8

    def load_tokenizer(self):
        tokenizer = T5Tokenizer.from_pretrained(self.model_name)
        tokenizer.add_tokens(['<sep>'], special_tokens=True)
        tokenizer.sep_token = '<sep>'
        tokenizer.sep_token_id = tokenizer.convert_tokens_to_ids(
            tokenizer.sep_token)
        return tokenizer

    def normalise_text(self, text):
        text = text.strip()
        if text and text[-1] != '.':
            text += '.'
        return text

    def post_process(self, lrml):
        lrml = lrml.strip()
        # lrml = lrml[lrml.find('if('):]
        lrml = lrml.replace('[', '(').replace(']', ')').replace(
            '{', '(').replace('}', ')')
        lrml = lrml.replace(').', ')')
        lrml = fix_then(lrml, ' ')
        lrml = revert_tree_based_spacing(lrml)
        lrml = add_space_after_comma(lrml)

        return lrml

    def predict(self, config):
        text = config['text']
        lrml = config['lrml']
        num_beams = int(config.get('num_beams', '5'))
        num_return_sequences = int(config.get(
            'num_return_sequences', str(num_beams)))
        no_repeat_ngram_size = int(config.get('no_repeat_ngram_size', '8'))
        max_length = int(config.get('max_length', '256'))
        early_stopping = str2bool(config.get('early_stopping', 'True'))
        print(text, lrml)
        if lrml.strip() != '':
            lrml = '<sep>' + lrml
        else:
            lrml = ''
        tokens = self.tokenizer('translate English to LegalRuleML: ' +
                                self.normalise_text(text) + lrml, return_tensors='pt')
        with torch.no_grad():
            generation = self.model.generate(inputs=tokens.input_ids, max_length=max_length, num_beams=num_beams,
                                             num_return_sequences=num_return_sequences, early_stopping=early_stopping,
                                             no_repeat_ngram_size=no_repeat_ngram_size)

        return [self.post_process(i) for i in self.tokenizer.batch_decode(generation, skip_special_tokens=True)]

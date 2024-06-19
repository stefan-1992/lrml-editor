import os
import re
import pandas as pd
import datetime
import sqlite3


LRML_DF_MAPPING = {
'FILE_NAME': 'file',
 'CLAUSE_NUMBER': 'number',
 'ID': 'id',
 'CREATED_AT': 'created_at',
 'TEXT': 'text',
 'LRML': 'lrml',
 'PARAPHRASE': 'paraphrase',
 'COMMENTS': 'comment',
 'UPDATED_AT': 'updated_at',
 'KEY': 'Key',
 'DESCRIPTION': 'Description',
}

class DatabaseHelper:

    def __init__(self) -> None:
        self.conn = sqlite3.connect('data/lrml_editor.db')
        self.conn.row_factory = sqlite3.Row  # To enable named access to columns


    def get_dictionary_keys(self, names):
        output = {}
        for i in names:
            df = self.retrieve_from_db(i)
            output[i] = df[['Key', 'Description']].to_dict(orient='records')
        return output
        
    def load_table(self, name):
        df = self.retrieve_from_db(name)
        return df.fillna('')
    
            
    def update_dict(self, name, value, reference, author):
        print('update_dict')
        with self.conn:
            cur = self.conn.cursor()
            cur.execute(f'''
                INSERT INTO {name} (KEY, ATOM_NAME, DESCRIPTION, REFERENCE, TEXT)
                VALUES (?, ?, ?, ?, ?)
            ''', (value, value, 'LRMl Editor - ' + author, reference, split_camel_case_with_numbers(value)))
            new_id = cur.lastrowid
            print('New ID: ', new_id)
            return new_id

    def update_lrml_df(self, row):
        print('update_lrml_df')
        if row.get('id') is None:
            print('Add new row')
            with self.conn:
                cur = self.conn.cursor()
                cur.execute('''
                    INSERT INTO LRML (FILE_NAME, CLAUSE_NUMBER)
                    VALUES (?, ?)
                ''', (row['file'], row['number']))
                new_id = cur.lastrowid
                print('New ID: ', new_id)
                return new_id
        else:
            print('Update row')
            with self.conn:
                cur = self.conn.cursor()
                cur.execute('''
                    INSERT INTO LRML_UPDATES (TEXT, LRML, PARAPHRASE, COMMENTS, AUTHOR, LRML_ID)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (row['text'], row['lrml'], row['paraphrase'], row['comment'], row['author'], row['id']))
                self.conn.commit()
                print('Values inserted for', row['id'])
                return row['id']


    def retrieve_from_db(self, name):
        print('Load table:', name, 'from SQLite')
        with self.conn:
            cur = self.conn.cursor()
            cur.execute(f'SELECT * FROM {name}')
            rows = cur.fetchall()
            columns = [description[0] for description in cur.description]
            new_df = pd.DataFrame(rows, columns=columns)
        return new_df.rename(columns=LRML_DF_MAPPING)
    

    def save_analytics(self, values):
        with self.pool.acquire() as connection:
            with connection.cursor() as cur:
                cur.execute('INSERT into ANALYTICS (FUNC, VALUE, FILE_NAME, CLAUSE_NUMBER, AUTHOR) VALUES (:func1, :value1, :file1, :number1, :author1)', 
                            func1=values['func'], value1=values['value'], file1=values['file'], number1=values['number'], author1=values['author'])
                connection.commit()
                return True


    def save_analytics(self, values):
        print('save_analytics')
        with self.conn:
            cur = self.conn.cursor()
            cur.execute('''
                INSERT INTO ANALYTICS (FUNC, VALUE, FILE_NAME, CLAUSE_NUMBER, AUTHOR)
                VALUES (?, ?, ?, ?, ?)
            ''', (values['func'], values['value'], values['file'], values['number'], values['author']))
            self.conn.commit()
            return True

def split_camel_case_with_numbers(text):
    return re.sub(r'([a-z])([A-Z0-9])', r'\1 \2', text).lower()

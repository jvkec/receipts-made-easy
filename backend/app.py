from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import cv2
import numpy as np
import pytesseract
from PIL import Image
import io
import csv
from datetime import datetime
import re

app = Flask(__name__)
CORS(app)

# in memory storage for receipts for now (dbase later)
receipts_db = []

def extract_items_from_text(text):

    lines = text.split('\n')
    items = []
    
    # price pattern
    price_pattern = r'\$?\s*(\d+\.\d{2})'
    
    for line in lines:

        # skipping empty lines & footers & headers
        if not line.strip() or any(word in line.lower() for word in ['total', 'subtotal', 'tax', 'balance']):
            continue
            
        # searching for price in line
        price_match = re.search(price_pattern, line)
        if price_match:
            price = float(price_match.group(1))
            # remove price to get item description
            description = re.sub(price_pattern, '', line).strip()
            if description:
                items.append({
                    'description': description,
                    'price': price
                })
    
    return items

@app.route('/upload', methods=['POST'])
def upload_receipt():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    # file -> image for processing
    image_stream = io.BytesIO(file.read())
    image = Image.open(image_stream)
    
    # PIL -> opencv image
    cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # preprocess image
    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    
    # extract text w/ tesseract
    text = pytesseract.image_to_string(thresh)
    
    # extract items
    items = extract_items_from_text(text)
    
    # storing info
    receipt_data = {
        'id': len(receipts_db) + 1,
        'timestamp': datetime.now().isoformat(),
        'text': text,
        'items': items
    }
    receipts_db.append(receipt_data)
    
    return jsonify(receipt_data)

@app.route('/export-csv', methods=['GET'])
def export_csv():
    if not receipts_db:
        return jsonify({'error': 'No receipts to export'}), 404
    
    # creating csv in memory for now (dbase later)
    output = io.StringIO()
    writer = csv.writer(output)
    
    # writing headers
    writer.writerow(['Receipt ID', 'Date', 'Item', 'Price'])
    
    # writing data
    for receipt in receipts_db:
        receipt_id = receipt['id']
        date = datetime.fromisoformat(receipt['timestamp']).strftime('%Y-%m-%d')
        
        for item in receipt['items']:
            writer.writerow([
                receipt_id,
                date,
                item['description'],
                item['price']
            ])
    
    # prepare the response
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'receipts_export_{datetime.now().strftime("%Y%m%d")}.csv'
    )

@app.route('/categorize', methods=['POST'])
def categorize_receipt():
    data = request.json
    text = data.get('text', '')
    
    # sample categorization logic
    categories = {
        'starbucks': 'MEALS',
        'uber': 'TRAVEL',
        'staples': 'OFFICE_SUPPLIES'
    }
    
    category = 'UNCATEGORIZED'
    for keyword, cat in categories.items():
        if keyword.lower() in text.lower():
            category = cat
            break
    
    return jsonify({'category': category})

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_RUN_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)


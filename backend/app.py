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
from google.cloud import vision
from config import GOOGLE_CREDENTIALS_PATH
from typing import List, Dict, Optional

app = Flask(__name__)
CORS(app)

# in memory storage for receipts for now (dbase later)
receipts_db = []

# initializing vision client
client = vision.ImageAnnotatorClient()

# item categories (refuse to pay for any more apis)
ITEM_CATEGORIES = {
    'burger': 'FOOD',
    'fries': 'FOOD',
    'pizza': 'FOOD',
    'sandwich': 'FOOD',
    'salad': 'FOOD',
    'soup': 'FOOD',
    'coffee': 'BEVERAGE',
    'tea': 'BEVERAGE',
    'soda': 'BEVERAGE',
    'drink': 'BEVERAGE',
    'milkshake': 'BEVERAGE',
    'juice': 'BEVERAGE',
    
    # Groceries
    'milk': 'GROCERY',
    'bread': 'GROCERY',
    'eggs': 'GROCERY',
    'cheese': 'GROCERY',
    'meat': 'GROCERY',
    'fish': 'GROCERY',
    'vegetable': 'GROCERY',
    'fruit': 'GROCERY',
    
    # Household
    'paper': 'HOUSEHOLD',
    'towel': 'HOUSEHOLD',
    'cleaner': 'HOUSEHOLD',
    'soap': 'HOUSEHOLD',
    'detergent': 'HOUSEHOLD',
    
    # Electronics
    'battery': 'ELECTRONICS',
    'charger': 'ELECTRONICS',
    'cable': 'ELECTRONICS',
    'phone': 'ELECTRONICS',
    
    # Personal Care
    'shampoo': 'PERSONAL_CARE',
    'toothpaste': 'PERSONAL_CARE',
    'deodorant': 'PERSONAL_CARE',
    
    # Clothing & Accessories
    'shirt': 'CLOTHING',
    'pants': 'CLOTHING',
    'dress': 'CLOTHING',
    'jacket': 'CLOTHING',
    'coat': 'CLOTHING',
    'sweater': 'CLOTHING',
    'hoodie': 'CLOTHING',
    'shoes': 'CLOTHING',
    'shoe': 'CLOTHING',
    'boots': 'CLOTHING',
    'sandals': 'CLOTHING',
    'sneakers': 'CLOTHING',
    'hat': 'CLOTHING',
    'cap': 'CLOTHING',
    'beanie': 'CLOTHING',
    'socks': 'CLOTHING',
    'underwear': 'CLOTHING',
    'belt': 'CLOTHING',
    'scarf': 'CLOTHING',
    'gloves': 'CLOTHING',
    'jewelry': 'CLOTHING',
    'watch': 'CLOTHING',
    'accessory': 'CLOTHING',
    'accessories': 'CLOTHING',
}

# health check endpoint
@app.route('/')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Receipt processing API is running'
    })

def classify_item(description: str) -> str:
    """Classify an item based on its description."""
    description = description.lower()
    
    for keyword, category in ITEM_CATEGORIES.items():
        if keyword in description:
            return category
            
    return 'OTHER'

def extract_items_from_text(text: str) -> List[Dict[str, any]]:
    lines = text.split('\n')
    items = []
    
    price_pattern = r'\$?\s*(\d+\.\d{2})'
    
    for line in lines:
        if not line.strip() or any(word in line.lower() for word in ['total', 'subtotal', 'tax', 'balance']):
            continue
            
        price_match = re.search(price_pattern, line)
        if price_match:
            price = float(price_match.group(1))
            description = re.sub(price_pattern, '', line).strip()
            if description:
                category = classify_item(description)
                items.append({
                    'description': description,
                    'price': price,
                    'category': category
                })
    
    return items

@app.route('/upload', methods=['POST'])
def upload_receipt():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    content = file.read()
    
    # file -> image for processing
    #image_stream = io.BytesIO(file.read())
    # image = Image.open(image_stream)
    
    # # PIL -> opencv image
    # cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # # preprocess image
    # gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    # thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    
    # # extract text w/ tesseract
    # text = pytesseract.image_to_string(thresh)
    
    # # extract items
    # items = extract_items_from_text(text)
    
    # # storing info
    # receipt_data = {
    #     'id': len(receipts_db) + 1,
    #     'timestamp': datetime.now().isoformat(),
    #     'text': text,
    #     'items': items
    # }
    # receipts_db.append(receipt_data)
    
    # return jsonify(receipt_data)


    try:
        # creating gcv image
        image = vision.Image(content=content)
        
        # text detection
        response = client.text_detection(image=image)
        
        if response.error.message:
            return jsonify({'error': response.error.message}), 400
            
        if not response.text_annotations:
            return jsonify({'error': 'No text detected in image'}), 400
            
        # get the full text from the response
        text = response.text_annotations[0].description
        
        # extract items and other data
        items = extract_items_from_text(text)
        extracted_data = parse_receipt_text(text)
        
        # store receipt data
        receipt_data = {
            'id': len(receipts_db) + 1,
            'timestamp': datetime.now().isoformat(),
            'text': text,
            'items': items,
            'vendor': extracted_data.get('vendor', 'Unknown'),
            'amount': extracted_data.get('total_amount', 0),
            'date': extracted_data.get('date', datetime.now().strftime('%Y-%m-%d'))
        }
        
        receipts_db.append(receipt_data)
        return jsonify(receipt_data)
        
    except Exception as e:
        print(f"Error processing receipt: {str(e)}")
        return jsonify({'error': 'Failed to process receipt'}), 500

def parse_receipt_text(text):
    """Enhanced receipt text parsing"""
    data = {}
    
    # data patterns
    date_patterns = [
        r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b',  # MM/DD/YYYY or DD/MM/YYYY
        r'\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b',    # YYYY/MM/DD
    ]
    
    # amnt patterns
    amount_pattern = r'\b(?:total|amount|sum).*?\$?\s*(\d+\.\d{2})\b'
    
    # try to find date
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['date'] = match.group(0)
            break
    
    # try to find total amount
    amount_match = re.search(amount_pattern, text, re.IGNORECASE)
    if amount_match:
        data['total_amount'] = float(amount_match.group(1))
    
    # # Ttryy to find vendor (usually in first few lines)
    # lines = text.split('\n')
    # if lines:
    #     data['vendor'] = lines[0].strip()
    
    return data

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

@app.route('/routes')
def list_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'path': str(rule)
        })
    return jsonify(routes)

@app.route('/classify-item', methods=['POST'])
def classify_item_endpoint():
    data = request.json
    description = data.get('description', '')
    category = classify_item(description)
    return jsonify({'category': category})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)


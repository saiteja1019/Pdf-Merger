from flask import Flask, render_template, request, jsonify, send_file
import os
from PyPDF2 import PdfMerger
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'output'

# Create directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    files = request.files.getlist('files')
    uploaded_files = []
    
    for file in files:
        if file and file.filename.endswith('.pdf'):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            uploaded_files.append(filename)
    
    return jsonify({'files': uploaded_files})

@app.route('/merge', methods=['POST'])
def merge_pdfs():
    data = request.get_json()
    filenames = data.get('files', [])
    
    merger = PdfMerger()
    output_filename = f"merged_{uuid.uuid4().hex[:8]}.pdf"
    
    for filename in filenames:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(filepath):
            merger.append(filepath)
    
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
    merger.write(output_path)
    merger.close()
    
    return jsonify({'merged_file': output_filename})

@app.route('/download/<filename>')
def download_file(filename):
    filepath = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    return send_file(filepath, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
import os
import json
import logging
import numpy as np
from PIL import Image
from io import BytesIO
import base64

from flask import Flask, render_template, request, jsonify

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")

# Load disease data
with open('static/data/diseases.json', 'r') as f:
    DISEASE_DATA = json.load(f)

def compare_images(uploaded_image, crop_type):
    """
    Simple image comparison for disease detection
    This is a basic implementation that compares color histograms
    """
    try:
        # Convert base64 to image
        image_data = base64.b64decode(uploaded_image.split(',')[1])
        img = Image.open(BytesIO(image_data))
        
        # Resize image for processing
        img = img.resize((100, 100))
        img_array = np.array(img)
        
        # Calculate average color values in red and green channels
        # Different diseases affect plants differently in color spectrum
        red_channel = img_array[:,:,0].mean()
        green_channel = img_array[:,:,1].mean()
        
        # Simple algorithm to detect disease based on color distribution
        # In a real app, this would be a more sophisticated ML model
        diseases = []
        
        if crop_type == "cotton":
            if red_channel > 120 and green_channel < 100:
                diseases.append("cotton_leaf_spot")
            if red_channel > 150 and green_channel < 80:
                diseases.append("cotton_boll_rot")
        elif crop_type == "coconut":
            if red_channel > 100 and green_channel < 90:
                diseases.append("coconut_leaf_spot")
            if red_channel > 130 and green_channel < 100:
                diseases.append("coconut_bud_rot")
        
        # If no specific disease detected
        if not diseases:
            if green_channel < 100:
                diseases.append("generic_disease")
        
        return diseases if diseases else ["healthy"]
    
    except Exception as e:
        logger.error(f"Error in image comparison: {str(e)}")
        return ["error"]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect', methods=['POST'])
def detect_disease():
    try:
        data = request.json
        image_data = data.get('image')
        crop_type = data.get('cropType')
        
        if not image_data or not crop_type:
            return jsonify({'error': 'Missing image data or crop type'}), 400
        
        detected_diseases = compare_images(image_data, crop_type)
        
        # Get disease information from our dataset
        disease_info = []
        for disease in detected_diseases:
            if disease in DISEASE_DATA:
                disease_info.append(DISEASE_DATA[disease])
            elif disease == "healthy":
                disease_info.append({
                    "name": "Healthy Plant",
                    "description": "No disease detected.",
                    "recommended_pesticides": []
                })
            elif disease == "error":
                disease_info.append({
                    "name": "Detection Error",
                    "description": "Unable to process the image.",
                    "recommended_pesticides": []
                })
        
        return jsonify({
            'diseases': detected_diseases,
            'disease_info': disease_info,
            'field_data': generate_field_data(detected_diseases, crop_type)
        })
    
    except Exception as e:
        logger.error(f"Error in disease detection: {str(e)}")
        return jsonify({'error': str(e)}), 500

def generate_field_data(diseases, crop_type):
    """
    Generate field representation with disease hotspots
    """
    # Create a 10x10 grid field
    field_size = 10
    field = [[0 for _ in range(field_size)] for _ in range(field_size)]
    
    # If plant is healthy, return empty field
    if diseases == ["healthy"] or diseases == ["error"]:
        return {
            "grid": field,
            "hotspots": []
        }
    
    # Generate random disease hotspots
    num_hotspots = min(len(diseases) * 2, 5)  # 2 hotspots per disease, max 5
    hotspots = []
    
    for _ in range(num_hotspots):
        x = np.random.randint(0, field_size)
        y = np.random.randint(0, field_size)
        disease_index = np.random.randint(0, len(diseases))
        disease_name = diseases[disease_index]
        
        # Mark the hotspot
        field[y][x] = 1
        
        hotspots.append({
            "x": x,
            "y": y,
            "disease": disease_name
        })
    
    return {
        "grid": field,
        "hotspots": hotspots
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

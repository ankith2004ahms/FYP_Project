import os
import sys
import json
import base64
import logging
import contextlib
import io
import numpy as np
import tensorflow as tf
from PIL import Image
from datetime import datetime

# Suppress TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
tf.get_logger().setLevel(logging.ERROR)

# Model selection: prefer environment override but default to the new `my_cnn_model.h5` as requested
MODEL_FILENAME = os.getenv('PREDICT_MODEL_FILE', 'my_cnn_model.h5')
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', MODEL_FILENAME)
LABELS_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'labels.json')

def load_labels():
    """
    Load labels from models/labels.json if present.
    Expected format: a JSON array of class names, e.g. ["Apple___healthy", "..."]
    Falls back to a default short list if file missing or invalid.
    """
    try:
        with open(LABELS_PATH, 'r', encoding='utf-8') as f:
            labels = json.load(f)
            if isinstance(labels, list) and labels:
                return labels
    except Exception:
        pass

    # Fallback labels (complete 38-class list used by the trained model)
    return [
        "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
        "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
        "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
        "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy", "Grape___Black_rot",
        "Grape___Esca_(Black_Measles)", "Grape___healthy", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
        "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
        "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight",
        "Potato___Late_blight", "Potato___healthy", "Raspberry___healthy", "Soybean___healthy",
        "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
        "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
        "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
        "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
        "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy"
    ]

# Load labels once at import time
CLASS_LABELS = load_labels()

def preprocess_image(image_bytes, target_size=(64, 64), use_mobilenet=False):
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Ensure classic antialiasing for downscaling
        image = image.resize((int(target_size[0]), int(target_size[1])), Image.LANCZOS)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        img_array = np.array(image).astype(np.float32)

        if use_mobilenet:
            # MobileNetV2-style preprocessing ([-1,1])
            img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
        else:
            # Standard 0-1 scaling used by many small CNNs (including 64x64 models)
            img_array = img_array / 255.0

        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(json.dumps({'error': f'Failed to preprocess image: {str(e)}'}), file=sys.stderr)
        sys.exit(1)

# Compatibility helper: wrap InputLayer to accept legacy 'batch_shape' kwarg
class _CompatInputLayer(tf.keras.layers.InputLayer):
    def __init__(self, *args, **kwargs):
        # If legacy models include 'batch_shape', translate to 'input_shape' by dropping batch dim
        if 'batch_shape' in kwargs and 'input_shape' not in kwargs:
            try:
                bs = kwargs.pop('batch_shape')
                if isinstance(bs, (list, tuple)) and len(bs) >= 2:
                    kwargs['input_shape'] = tuple(bs[1:])
            except Exception:
                # ignore and proceed; the base class may still complain
                pass
        super().__init__(*args, **kwargs)

# Compatibility shim for legacy Keras dtype policy objects (e.g., 'DTypePolicy')
# The old models sometimes serialized a DTypePolicy object which is not present in newer TF/Keras
# implementations. To handle this, provide a from_config that returns a modern Policy.
class _CompatDTypePolicy:
    @classmethod
    def from_config(cls, config):
        # config is expected to be a dict with 'name' like {'name': 'float32'}
        try:
            name = None
            if isinstance(config, dict):
                name = config.get('name') or config.get('dtype')
            elif hasattr(config, 'get'):
                name = config.get('name')
            if not name:
                name = 'float32'
            return tf.keras.mixed_precision.Policy(name)
        except Exception:
            # Fallback: default float32 policy
            return tf.keras.mixed_precision.Policy('float32')

    def get_config(self):
        return {'name': 'float32'}


def load_model_with_custom_objects():
    try:
        # Provide a clear message which model path we're attempting to load
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f'Model file not found at {MODEL_PATH}')

        # Log informational messages to stderr so stdout contains only the final prediction JSON
        print(json.dumps({'info': f'Loading model from {MODEL_PATH}'}), file=sys.stderr)

        try:
            # First try: normal load (preferred)
            model = tf.keras.models.load_model(
                MODEL_PATH,
                compile=False,
                safe_mode=False
            )
            return model
        except Exception as first_err:
            # If this is a known serialization issue (older Keras with 'batch_shape'), retry with compat wrapper
            msg = str(first_err)
            if 'batch_shape' in msg or 'Unrecognized keyword arguments' in msg or 'InputLayer' in msg:
                # Warnings and diagnostics go to stderr
                print(json.dumps({'warn': f'Initial load failed with InputLayer deserialization error, retrying with compatibility wrapper: {msg}'}), file=sys.stderr)
                try:
                    model = tf.keras.models.load_model(
                        MODEL_PATH,
                        compile=False,
                        safe_mode=False,
                        custom_objects={'InputLayer': _CompatInputLayer, 'DTypePolicy': _CompatDTypePolicy}
                    )
                    # Successful load info to stderr
                    print(json.dumps({'info': 'Loaded model successfully using compatibility InputLayer wrapper'}), file=sys.stderr)
                    return model
                except Exception as second_err:
                    # Fall through to final error handler
                    first_err = second_err

            # If not a known issue or retry failed, raise
            raise first_err
    except Exception as e:
        print(json.dumps({'error': f'Failed to load model: {str(e)}'}), file=sys.stderr)
        sys.exit(1)

def process_prediction_result(prediction):
    try:
        # prediction[0] expected shape: (num_classes,)
        probs = np.asarray(prediction[0], dtype=np.float32)

        # If outputs are logits or don't sum to ~1, apply softmax
        s = float(np.sum(probs))
        if not (0.999 <= s <= 1.001):
            probs = tf.nn.softmax(probs).numpy()

        predicted_class = int(np.argmax(probs))
        confidence = float(probs[predicted_class])

        # Use loaded labels (safe-guard index)
        disease_classes = CLASS_LABELS
        disease_name = disease_classes[predicted_class] if predicted_class < len(disease_classes) else 'Unknown'

        return {
            'disease': disease_name,
            'confidence': confidence,
            'class_index': predicted_class,
            'date': datetime.now().isoformat()
        }
    except Exception as e:
        print(json.dumps({'error': f'Failed to process prediction: {str(e)}'}), file=sys.stderr)
        sys.exit(1)

def predict(image_base64):
    try:
        model = load_model_with_custom_objects()

        # Determine model input size (robustly handle different input_shape formats)
        target_h = 64
        target_w = 64
        try:
            inp_shape = model.input_shape  # could be tuple or list
            # If list (multi-input), pick first
            if isinstance(inp_shape, list):
                inp_shape = inp_shape[0]
            # inp_shape is like (None, H, W, C) or (None, C, H, W)
            ints = [s for s in inp_shape if isinstance(s, int) and s > 1]
            if len(ints) >= 2:
                # prefer (H, W)
                target_h, target_w = ints[0], ints[1]
        except Exception:
            # fallback defaults kept
            target_h, target_w = 64, 64

        # Choose MobileNet preprocessing only if model expects 224x224 (common convention)
        use_mobilenet = (target_h == 224 and target_w == 224)

        image_bytes = base64.b64decode(image_base64)
        processed_image = preprocess_image(image_bytes, target_size=(target_h, target_w), use_mobilenet=use_mobilenet)

        with tf.device('/CPU:0'):  # Force CPU usage
            prediction = model.predict(processed_image, verbose=0)

        # Validate that model outputs align with labels
        try:
            out_shape = model.output_shape
            if isinstance(out_shape, list):
                out_shape = out_shape[0]
            num_classes_from_model = None
            if isinstance(out_shape, (list, tuple)) and len(out_shape) >= 2 and isinstance(out_shape[1], int):
                num_classes_from_model = int(out_shape[1])
            if num_classes_from_model is not None and len(CLASS_LABELS) != num_classes_from_model:
                print(json.dumps({'warn': f'Number of labels ({len(CLASS_LABELS)}) does not match model output size ({num_classes_from_model})'}), file=sys.stderr)
        except Exception:
            # Non-fatal; continue
            pass

        result = process_prediction_result(prediction)
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    try:
        image_base64 = sys.stdin.read().strip()
        if not image_base64:
            print(json.dumps({'error': 'No image data received'}), file=sys.stderr)
            sys.exit(1)

        # remove data URI prefix if present: "data:image/png;base64,..."
        if image_base64.startswith('data:'):
            try:
                image_base64 = image_base64.split(',', 1)[1]
            except Exception:
                pass

        predict(image_base64)
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1) 
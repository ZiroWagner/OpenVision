from pathlib import Path

import numpy as np
import onnxruntime
from PIL import Image

COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
    "truck", "boat", "traffic light", "fire hydrant", "stop sign",
    "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
    "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag",
    "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball", "kite",
    "baseball bat", "baseball glove", "skateboard", "surfboard",
    "tennis racket", "bottle", "wine glass", "cup", "fork", "knife", "spoon",
    "bowl", "banana", "apple", "sandwich", "orange", "broccoli", "carrot",
    "hot dog", "pizza", "donut", "cake", "chair", "couch", "potted plant",
    "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote",
    "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear",
    "hair drier", "toothbrush",
]

MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "models" / "yolo11n.onnx"


class YOLODetector:
    def __init__(
        self, model_path: str | Path = MODEL_PATH,
        conf_threshold: float = 0.5,
        iou_threshold: float = 0.45,
    ):
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.session = onnxruntime.InferenceSession(
            str(model_path),
            providers=["CPUExecutionProvider"],
        )
        self.input_name = self.session.get_inputs()[0].name

    def preprocess(self, frame: np.ndarray) -> np.ndarray:
        input_h, input_w = 640, 640
        h, w = frame.shape[:2]
        scale = min(input_w / w, input_h / h)
        new_w = int(w * scale)
        new_h = int(h * scale)

        resized = np.empty((input_h, input_w, 3), dtype=np.uint8)
        resized.fill(114)
        resized_frame = np.array(Image.fromarray(frame).resize((new_w, new_h)))
        resized[:new_h, :new_w] = resized_frame

        img = resized.astype(np.float32) / 255.0
        img = np.transpose(img, (2, 0, 1))
        img = np.expand_dims(img, axis=0)
        return img

    def predict(self, frame: np.ndarray, classes: list[int] | None = None) -> list[dict]:
        input_tensor = self.preprocess(frame)
        outputs = self.session.run(None, {self.input_name: input_tensor})[0]
        return self.postprocess(outputs, frame.shape, classes)

    def postprocess(
        self, outputs: np.ndarray, orig_shape: tuple[int, ...], classes: list[int] | None
    ) -> list[dict]:
        orig_h, orig_w = orig_shape[:2]
        input_h, input_w = 640, 640
        scale = min(input_w / orig_w, input_h / orig_h)
        pad_x = (input_w - orig_w * scale) / 2
        pad_y = (input_h - orig_h * scale) / 2

        outputs = np.squeeze(outputs, axis=0)
        boxes = outputs[:4, :]
        scores = outputs[4:, :]

        candidates = []
        for i in range(scores.shape[1]):
            class_id = int(np.argmax(scores[:, i]))
            confidence = float(scores[class_id, i])
            if confidence < self.conf_threshold:
                continue
            if classes is not None and class_id not in classes:
                continue

            xc, yc, w, h = boxes[:, i]
            x1 = (xc - w / 2 - pad_x) / scale
            y1 = (yc - h / 2 - pad_y) / scale
            x2 = (xc + w / 2 - pad_x) / scale
            y2 = (yc + h / 2 - pad_y) / scale

            x1 = max(0, min(x1, orig_w))
            y1 = max(0, min(y1, orig_h))
            x2 = max(0, min(x2, orig_w))
            y2 = max(0, min(y2, orig_h))

            candidates.append({
                "bbox": [float(x1), float(y1), float(x2), float(y2)],
                "confidence": confidence,
                "class_id": class_id,
                "class_name": COCO_CLASSES[class_id] if class_id < len(COCO_CLASSES) else "unknown",
            })

        candidates.sort(key=lambda x: x["confidence"], reverse=True)
        kept = []
        for det in candidates:
            if not self._nms_suppressed(det, kept):
                kept.append(det)
        return kept

    def _nms_suppressed(self, det: dict, kept: list[dict]) -> bool:
        x1, y1, x2, y2 = det["bbox"]
        area = (x2 - x1) * (y2 - y1)
        for k in kept:
            kx1, ky1, kx2, ky2 = k["bbox"]
            ix1 = max(x1, kx1)
            iy1 = max(y1, ky1)
            ix2 = min(x2, kx2)
            iy2 = min(y2, ky2)
            if ix2 > ix1 and iy2 > iy1:
                inter = (ix2 - ix1) * (iy2 - iy1)
                iou = inter / (area + (kx2 - kx1) * (ky2 - ky1) - inter)
                if iou > self.iou_threshold:
                    return True
        return False

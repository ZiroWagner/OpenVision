import numpy as np
import pytest

from app.services.detector import YOLODetector


@pytest.fixture
def mock_session(monkeypatch):
    class MockSession:
        def get_inputs(self):
            return [type("obj", (object,), {"name": "images"})()]

        def run(self, _, input_data):
            batch = input_data["images"]
            n, c, h, w = batch.shape
            num_dets = 8400
            outputs = np.zeros((1, 84, num_dets), dtype=np.float32)
            outputs[0, 0, 0] = 0.5
            outputs[0, 1, 0] = 0.5
            outputs[0, 2, 0] = 0.5
            outputs[0, 3, 0] = 0.5
            outputs[0, 4, 0] = 0.85
            return [outputs]

        def __init__(self, model_path, providers):
            pass

    monkeypatch.setattr("onnxruntime.InferenceSession", MockSession)


def test_detector_initialization(mock_session):
    det = YOLODetector(model_path="fake.onnx")
    assert det.conf_threshold == 0.5
    assert det.iou_threshold == 0.45


def test_preprocess_output_shape(mock_session):
    det = YOLODetector(model_path="fake.onnx")
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    blob = det.preprocess(frame)
    assert blob.shape == (1, 3, 640, 640)
    assert blob.dtype == np.float32


def test_predict_returns_detections(mock_session):
    det = YOLODetector(model_path="fake.onnx", conf_threshold=0.5)
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    results = det.predict(frame, classes=[0])
    assert isinstance(results, list)
    for r in results:
        assert "bbox" in r
        assert "confidence" in r
        assert "class_id" in r
        assert "class_name" in r
        assert len(r["bbox"]) == 4


def test_predict_filters_by_confidence(mock_session):
    det = YOLODetector(model_path="fake.onnx", conf_threshold=0.9)
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    results = det.predict(frame, classes=[0])
    assert len(results) == 0


def test_predict_filters_by_class(mock_session):
    det = YOLODetector(model_path="fake.onnx", conf_threshold=0.5)
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    results = det.predict(frame, classes=[1])
    assert len(results) == 0

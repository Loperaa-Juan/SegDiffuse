from __future__ import annotations

import logging
import time

import cv2
import numpy as np
import torch
from detectron2 import model_zoo
from detectron2.config import get_cfg
from detectron2.data import MetadataCatalog
from detectron2.engine import DefaultPredictor
from PIL import Image

from config.service.settings import settings
from src.models import SegmentationResult

logger = logging.getLogger(__name__)


class SegmentationEngine:
    def __init__(self) -> None:
        logger.info("Initializing SegmentationEngine")
        logger.info("Loading model config: %s", settings.segmentation_model_config)

        cfg = get_cfg()
        cfg.merge_from_file(
            model_zoo.get_config_file(settings.segmentation_model_config)
        )
        cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = settings.confidence_threshold
        cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(settings.model_weights)

        device = settings.device if torch.cuda.is_available() else "cpu"
        if device != settings.device:
            logger.warning(
                "CUDA not available, falling back to CPU (requested: %s)",
                settings.device,
            )
        cfg.MODEL.DEVICE = device

        logger.info("Model weights: %s", settings.model_weights)
        logger.info(
            "Device: %s | Confidence threshold: %s",
            device,
            settings.confidence_threshold,
        )

        self._cfg = cfg

        logger.info("Loading predictor...")
        t0 = time.perf_counter()
        self._predictor = DefaultPredictor(cfg)
        logger.info("Predictor ready in %.2fs", time.perf_counter() - t0)

    def predict(self, image: np.ndarray) -> SegmentationResult:
        """Run instance segmentation on a BGR image (OpenCV format)."""
        outputs = self._predictor(image)
        instances = outputs["instances"].to("cpu")

        masks: list[Image.Image] = []
        polygons: list[np.ndarray] = []
        for mask_tensor in instances.pred_masks:
            mask_np = mask_tensor.numpy().astype(np.uint8)
            masks.append(Image.fromarray(mask_np * 255))

            contours, _ = cv2.findContours(mask_np, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                largest = max(contours, key=cv2.contourArea)
                approx = cv2.approxPolyDP(largest, epsilon=2.0, closed=True)
                polygons.append(approx.reshape(-1, 2))
            else:
                polygons.append(np.empty((0, 2), dtype=np.int32))

        labels: list[int] = instances.pred_classes.tolist()
        scores: list[float] = instances.scores.tolist()

        metadata = MetadataCatalog.get(self._cfg.DATASETS.TRAIN[0])
        class_names = [metadata.thing_classes[l] for l in labels]

        return SegmentationResult(
            num_objects=len(masks),
            masks=masks,
            polygons=polygons,
            labels=labels,
            scores=scores,
            class_names=class_names,
        )

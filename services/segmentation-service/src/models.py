from dataclasses import dataclass

import numpy as np
from PIL import Image
from pydantic import BaseModel


@dataclass
class SegmentationResult:
    num_objects: int
    masks: list[Image.Image]
    polygons: list[np.ndarray]
    labels: list[int]
    scores: list[float]
    class_names: list[str]


class SegmentationResponse(BaseModel):
    num_objects: int
    labels: list[int]
    scores: list[float]
    class_names: list[str]
    masks: list[str]
    polygons: list[list[list[int]]]
